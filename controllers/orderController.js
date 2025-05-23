
const Order = require('../models/orderModel');
const Vendor = require('../models/vendorModel');
const Customer = require('../models/customerModel');
const Notification = require('../models/notificationModel');
const { calculateVendorEarnings } = require("../utilities/vendorEarningsUtilities");
const sendEmail = require('../config/sendEmail');
const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      subOrders,
      totalAmount,
      shippingAddress,
      updatedBy
    } = req.body;


    // Determine updatedByModel
    let updatedByModel = 'customers';


    // Set initial history per subOrder
    const subOrdersWithHistory = subOrders.map(sub => ({
      ...sub,
      status: 'Processing',
      statusHistory: [{ status: 'Processing', updatedBy, updatedByModel }]
    }));


    // Create the order first without paymentId (null)
    const order = new Order({
      customerId,
      subOrders: subOrdersWithHistory,
      totalAmount,
      shippingAddress,
      paymentId: null, // will be updated after payment
      overallStatus: 'Processing',
      overallStatusHistory: [
        {
          status: 'Processing',
          updatedBy: customerId,
          updatedByModel,
        },
      ],
    });

    const savedOrder = await order.save();
    return res.status(201).json({ orderId: savedOrder._id, message: 'Order created. Proceed to payment.' });
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId paymentId subOrders.vendorId subOrders.products.productId');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getConfirmOrderById = async (req, res) => {
  try {
    // const order = await Order.findById(req.params.id)
    //   .populate('customerId paymentId subOrders.vendorId subOrders.products.productId');
    const order = await Order.findById(req.params.id)
      .populate('customerId paymentId')
      .populate({
        path: 'subOrders',
        populate: [
          { path: 'vendorId', select: 'name email' },
          {
            path: 'products.productId',
            select: 'productName brand price images'
          }
        ]
      });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { subOrders, customerId } = order;

    // === Build HTML Rows Once ===
    let htmlRows = '';
    subOrders.forEach((subOrder, i) => {
      const vendorName = subOrder.vendorId.name;
      subOrder.products.forEach(product => {
        htmlRows += `
          <tr>
            <td>${i + 1}</td>
            <td>${vendorName}</td>
            <td>${product.productId.productName}</td>
            <td>${product.quantity}</td>
            <td>₹${product.priceAtPurchase.toFixed(2)}</td>
            <td>₹${(product.quantity * product.priceAtPurchase).toFixed(2)}</td>
          </tr>`;
      });
    });


    const html = `
  <div style="max-width: 700px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
    <h2 style="color: #4CAF50; border-bottom: 1px solid #eee; padding-bottom: 10px;">Your Order Details</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f9f9f9; text-align: left;">
          <th style="padding: 8px; border: 1px solid #ddd;">#</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Vendor</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Product</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>
    <p style="text-align: right; margin-top: 20px; font-weight: bold;">Total Amount: ₹${order.totalAmount.toFixed(2)}</p>
  </div>
`;

    // === Send Email to Customer ===
    if (order.overallStatus === 'Paid') {
      await sendEmail({
        to: customerId.email,
        subject: `Your Order ${order._id} has been placed Successfully.`,
        html,
      });

      // === Notify and Email Unique Vendors ===
      const vendorMap = new Map(); // Use Map to avoid repeat notifications

      subOrders.forEach(subOrder => {
        const vendor = subOrder.vendorId;
        if (!vendorMap.has(vendor._id.toString())) {
          vendorMap.set(vendor._id.toString(), vendor);
        }
      });

      // Use Promise.all to send all notifications/emails in parallel
      await Promise.all([...vendorMap.values()].map(async (vendor) => {
        await Notification.create({
          userId: vendor._id,
          userType: "vendors",
          type: "New Order Received",
          message: `You have received a new order ${order._id}. Please check your dashboard for details.`,
        });

        await sendEmail({
          to: vendor.email,
          subject: `New Order #${order._id} Received.`,
          html: `<p>Dear ${vendor.name},</p><p>You have received a new order. Please log in to your SmartBuy Vendor Dashboard to process it.</p>`
        });
      }));
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const getOrderByIdForAnalytics = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate([
        { path: 'customerId', select: 'name email' },
        // { path: 'paymentId', populate: { path: 'statusHistory.updatedBy', select: 'name email' } },
        {
          path: 'subOrders.vendorId',
          select: 'company.name email'
        },
        {
          path: 'subOrders.products.productId',
          select: 'name price'
        }
      ]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};


// Can be used by Vendor to update status to Shipped
// Can be used by Delivery Person to update status to Delivered
const updateSubOrderStatus = async (req, res) => {
  try {
    const { orderId, vendorId, status, updatedBy } = req.body;
    console.log("Request Body-", req.body);

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const subOrder = order.subOrders.find(sub => sub.vendorId.toString() === vendorId);
    if (!subOrder) return res.status(404).json({ error: 'Sub-order not found' });
    const subOrderId = subOrder._id;

    // Prevent cancelling an already delivered or cancelled sub-order
    if (status === 'Cancelled' && (subOrder.status === 'Delivered' || subOrder.status === 'Cancelled')) {
      return res.status(400).json({ error: 'Sub-order cannot be cancelled' });
    }

    subOrder.status = status;


    // Determine updatedByModel
    let updatedByModel = '';
    const vendor = await Vendor.findById(updatedBy);
    if (vendor) {
      updatedByModel = 'vendors';
    } else {
      const customer = await Customer.findById(updatedBy);
      if (customer) {
        updatedByModel = 'customers';
      }
    }

    console.log("updatedByModel-", updatedByModel);

    if (!updatedByModel) {
      return res.status(400).json({ error: 'Invalid updatedBy user' });
    }


    // maintain suborder history
    subOrder.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy,
      updatedByModel,
    });

    // Only set deliveredAt and vendorEarnings once
    if (status === 'Delivered' && !subOrder?.deliveredAt) {
      subOrder.deliveredAt = new Date();
      const vendorEarnings = await calculateVendorEarnings(Number(subOrder.subTotal));
      subOrder.vendorEarnings = vendorEarnings;

      console.log("deliveredAt", subOrder.deliveredAt);
      console.log("vendorEarnings", subOrder.vendorEarnings);

      // 🔥 Update vendor earnings and available Balance in vendor
      const vendor = await Vendor.findById(vendorId);
      console.log("Vendor is ", vendor);
      if (vendor) {
        vendor.totalEarned += vendorEarnings;
        vendor.availableBalance += vendorEarnings;
        await vendor.save();
      }

    }


    // Determine overall order status based on all sub-orders
    const allStatuses = order.subOrders.map(so => so.status);

    if (allStatuses.every(s => s === 'Cancelled')) {
      order.overallStatus = 'Cancelled';
    } else if (allStatuses.every(s => s === 'Delivered')) {
      order.overallStatus = 'Completed';
    } else if (allStatuses.every(s => s === 'Shipped')) {
      order.overallStatus = 'Shipped';
    } else if (
      allStatuses.some(s => s === 'Shipped')
    ) {
      order.overallStatus = 'Partially Shipped';
    } else if (
      allStatuses.some(s => s === 'Delivered') &&
      !allStatuses.some(s => s === 'Shipped')
    ) {
      order.overallStatus = 'Partially Delivered';
    } else {
      order.overallStatus = 'Paid';
    }
    console.log("updatedByModel second-", updatedByModel);
    console.log("updatedBy-", updatedBy);

    // Add status history for overallStatus
    order.overallStatusHistory.push({
      status: order.overallStatus,
      updatedAt: new Date(),
      updatedBy,
      updatedByModel,
    });

    await order.save();
    if (order) {
      // console.log("subOrder.status after saving Order-",subOrderId);
      // const subOrder = order.subOrders.find(sub => sub._id.toString() === subOrderId);
      // console.log("order.customerId after saving Order-",order.customerId);
      // console.log("subOrder.vendorId after saving Order-",subOrder.vendorId);

      console.log("subOrder.status after saving Order-", subOrder.status);
      console.log("order.customerId after saving Order-", order.customerId);
      console.log("subOrder.vendorId after saving Order-", subOrder.vendorId);
      if ((subOrder.status === 'Cancelled') && (updatedByModel === 'customers')) {
        // Create a notification for the vendor
        await Notification.create({
          userId: subOrder.vendorId,
          userType: "vendors",
          type: 'User CancelOrder',
          message: `SubOrder ${subOrder._id} of Order ${order._id}, has been cancelled by the user on ${new Date()}`,
        });
      } else if ((subOrder.status === 'Cancelled' || subOrder.status === 'Shipped' || subOrder.status === 'Delivered') && (updatedByModel === 'vendors')) {
        // Create a notification for the user
        await Notification.create({
          userId: order.customerId,
          userType: "customers",
          type: `Vendor ${subOrder.status} Order`,
          message: `SubOrder ${subOrder._id} of Order ${order._id}, has been ${subOrder.status} by the vendor on ${new Date()}`,
        });

      }
    }
    res.json({ message: 'SubOrder status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const getOrdersByCustomer = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId })
      .populate('subOrders.vendorId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// // Can be used by Vendor or User to update Status to Cancelled
// const cancelSubOrder = async (req, res) => {
//   const { orderId, subOrderId, updatedBy } = req.params;
//   // const userId = req.user._id;

//   try {
//     const order = await Order.findById(orderId);
//     if (!order) return res.status(404).json({ message: 'Order not found' });

//     const subOrder = order.subOrders.id(subOrderId);
//     if (!subOrder) return res.status(404).json({ message: 'SubOrder not found' });

//     // Prevent cancellation if already delivered or cancelled
//     if (subOrder.status === 'Delivered' || subOrder.status === 'Cancelled') {
//       return res.status(400).json({ message: 'SubOrder cannot be cancelled' });
//     }

//     subOrder.status = 'Cancelled';
//     subOrder.statusHistory.push({
//       status: 'Cancelled',
//       updatedAt: new Date(),
//       updatedBy: updatedBy,
//     });

//     // Update overallStatus of the Order to Cancelled, if all subOrders are cancelled
//     const allCancelled = order.subOrders.every(so => so.status === 'Cancelled');
//     if (allCancelled) {
//       order.overallStatus = 'Cancelled';
//       order.overallStatusHistory.push({
//         status: 'Cancelled',
//         updatedAt: new Date(),
//         updatedBy: updatedBy,
//       });
//     }

//     await order.save();

//     res.status(200).json({ message: 'SubOrder cancelled successfully', order });
//   } catch (error) {
//     console.error('Cancel SubOrder Error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };


module.exports = {
  createOrder,
  getOrderById,
  getConfirmOrderById,
  updateSubOrderStatus,
  getOrdersByCustomer,
  // cancelSubOrder,
  getOrderByIdForAnalytics
};












