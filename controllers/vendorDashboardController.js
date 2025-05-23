const Order = require('../models/orderModel');
const Payment = require('../models/paymentModel');
const Product = require('../models/productModel');
const Vendor = require('../models/vendorModel');
const ReturnRequest = require('../models/returnRequestModel');
const Notification = require('../models/notificationModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const vendorId = req.user._id;
    const orders = await Order.find({
      'subOrders.vendorId': vendorId,
      'subOrders.status': status
    }).populate('customerId subOrders.products.productId');

    res.json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching vendor orders' });
  }
};

exports.updateSubOrderStatus = async (req, res) => {
  try {
    const { orderId, subOrderId } = req.params;
    const { status } = req.body;
    const vendorId = req.user._id;

    const order = await Order.findById(orderId);
    const subOrder = order.subOrders.id(subOrderId);

    if (!subOrder || !subOrder.vendorId.equals(vendorId)) {
      return res.status(403).json({ message: 'Unauthorized to update this suborder' });
    }

    // Determine updatedByModel
    let updatedByModel = 'vendors';
    subOrder.status = status;
    subOrder.statusHistory.push({ status, updatedBy: vendorId, updatedByModel });

    await order.save();

    res.json({ message: 'SubOrder status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating suborder status' });
  }
};


exports.getOrdersByVendor = async (req, res) => {
  const { vendorId } = req.params;

  try {
    const orders = await Order.find({ 'subOrders.vendorId': vendorId })
      .populate([
        { path: 'customerId', select: 'name email phone' },
        { path: 'paymentId', select: 'status statusHistory paymentMethod paymentStatus transactionId' },
        {
          path: 'subOrders.vendorId',
          select: 'companyDetails.companyName email   companyDetails.companyAddress.country '
        },
        {
          path: 'subOrders.products.productId',
          select: 'productName price  category brand model color'
        }

      ])
      .sort({ createdAt: -1 });

    // Manually populate each subOrder.statusHistory.updatedBy
    for (const order of orders) {
      for (const subOrder of order.subOrders) {
        await Promise.all(
          subOrder.statusHistory.map(async (entry, index) => {
            if (entry.updatedBy && entry.updatedByModel) {
              const Model = entry.updatedByModel === 'vendors'
                ? require('../models/vendorModel')
                : require('../models/customerModel');
              const user = await Model.findById(entry.updatedBy).select('name');
              subOrder.statusHistory[index].updatedBy = user;
            }
          })
        );
      }
    }

    res.json(orders);
  } catch (error) {
    console.error('Failed to fetch vendor orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.approveReturn = async (req, res) => {
  try {
    const { orderId, subOrderId } = req.params;
    const vendorId = req.vendorId;

    // const order = await Order.findById(orderId).populate('paymentId');


    // Update the return request status and add rejection reason
    const returnRequest = await ReturnRequest.findOneAndUpdate(
      { orderId, subOrderId },
      {
        status: 'Approved',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return request not found.' });
    }

    const order = await Order.findOne({
      _id: orderId,
    });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const subOrder = order.subOrders.find(sub => sub._id.toString() === subOrderId);
    if (!subOrder) {
      return res.status(404).json({ message: 'SubOrder not found.' });
    }
    console.log("subOrder-", subOrder);



    if (!subOrder || !subOrder.vendorId.equals(vendorId)) {
      return res.status(403).json({ message: 'Unauthorized to approve return' });
    }

    const payment = await Payment.findOne({ order: orderId });

    if (!payment || !payment.transactionId) {
      return res.status(404).json({ message: 'Valid payment not found for refund' });
    }

    console.log("Total Amount is-", subOrder.subTotal);
    //Calculate refund amount for this subOrder
    const refundAmount = Math.round(subOrder.subTotal * 100); // in paisa

    console.log("Refund Amount is-", refundAmount);

    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
      amount: refundAmount,
    });

    // Determine updatedByModel
    let updatedByModel = 'vendors';

    payment.paymentStatus = 'Refunded';
    payment.statusHistory.push({ status: 'Refunded', updatedBy: vendorId, updatedByModel: updatedByModel });
    await payment.save();

    if (subOrder.status === 'Return Requested') {
      const wasDelivered = subOrder.statusHistory.some(
        (entry) => entry.status === 'Delivered'
      );

      if (wasDelivered) {
        const vendor = await Vendor.findById(vendorId);
        if (vendor) {
          vendor.totalEarned -= subOrder.vendorEarnings;
          vendor.availableBalance -= subOrder.vendorEarnings;
          await vendor.save();
        }

        subOrder.vendorEarnings = 0;
        subOrder.deliveredAt = null;
        subOrder.isVendorPaid = false;
      }

      // Restock the products
      for (const product of subOrder.products) {
        await Product.findByIdAndUpdate(product.productId, {
          $inc: { quantity: product.quantity }
        });
      }


      // Update SubOrder
      subOrder.status = 'Returned';
      subOrder.statusHistory.push({ status: 'Returned', updatedAt: new Date(), updatedBy: vendorId, updatedByModel: updatedByModel });

      if (order.subOrders.every(so => so.status === 'Returned')) {
        order.overallStatus = 'Returned';
        order.overallStatusHistory.push({
          status: 'Returned',
          updatedAt: new Date(),
          updatedBy: vendorId,
          updatedByModel,
        });
      }

      await order.save();
      if (refund.status === 'succeeded') {
        // Create a notification for the customer
        // await Notification.create({
        //   type: 'Return Request',
        //   message: `Your return request for SubOrder ${subOrderId} has been approved on ${order.overallStatusHistory.updatedAt}`,
        //   customerId: returnRequest.customerId
        // });

        await Notification.create({
          userId: order.customerId,
          userType: "customers",
          type: `Approved ReturnRequest`,
          message: `Your return request for SubOrder ${subOrderId} has been approved on ${new Date()}`,
        });
      }

      res.json({ message: 'Return approved and refunded successfully', refund });
    }
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Error processing refund' });
  }
};



exports.rejectReturnbyVendor = async (req, res) => {
  const { orderId, subOrderId } = req.params;
  const { rejectionReason, updatedBy } = req.body;

  try {
    // Update the return request status and add rejection reason
    const returnRequest = await ReturnRequest.findOneAndUpdate(
      { orderId, subOrderId },
      {
        status: 'Rejected',
        rejectionReason,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return request not found.' });
    }

    const vendorId = req.vendorId;

    // const order = await Order.findById(orderId).populate('paymentId');

    const order = await Order.findOne({
      _id: orderId,
    });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const subOrder = order.subOrders.find(sub => sub._id.toString() === subOrderId);
    if (!subOrder) {
      return res.status(404).json({ message: 'SubOrder not found.' });
    }
    console.log("subOrder-", subOrder);



    if (!subOrder || !subOrder.vendorId.equals(vendorId)) {
      return res.status(403).json({ message: 'Unauthorized to approve return' });
    }
    // Determine updatedByModel
    let updatedByModel = 'vendors';

    // Update SubOrder
    subOrder.status = 'Return Rejected';
    subOrder.statusHistory.push({ status: 'Return Rejected', updatedAt: new Date(), updatedBy: updatedBy, updatedByModel: updatedByModel });

    if (order.subOrders.every(so => so.status === 'Return Rejected')) {
      order.overallStatus = 'Return Rejected';
      order.overallStatusHistory.push({
        status: 'Return Rejected',
        updatedAt: new Date(),
        updatedBy: vendorId,
        updatedByModel,
      });
    }

    await order.save();


    if(order.overallStatus === 'Return Rejected'){
    await Notification.create({
      userId: order.customerId,
      userType: "customers",
      type: `Rejected ReturnRequest`,
      message: `Your return request for SubOrder ${subOrderId} has been rejected on ${new Date()}.  Reason: ${rejectionReason} `,
    });
    }
    res.status(200).json({ message: 'Return request rejected successfully.' });
  } catch (error) {
    console.error('Error rejecting return request:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};






exports.getOrderAndPaymentHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('customerId subOrders.products.productId');
    const payment = await Payment.findOne({ order: orderId });
    res.json({ orderHistory: order.overallStatusHistory, subOrderHistory: order.subOrders.map(s => s.statusHistory), paymentHistory: payment?.statusHistory || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching history' });
  }
};

exports.getVendorAnalytics = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const products = await Product.find({ vendorId });
    const productIds = products.map(p => p._id);

    const orders = await Order.find({ 'subOrders.vendorId': vendorId });

    const analytics = {};
    for (const product of products) {
      analytics[product._id] = { name: product.productName, sold: 0, revenue: 0 };
    }

    for (const order of orders) {
      for (const sub of order.subOrders) {
        if (sub.vendorId.equals(vendorId)) {
          for (const p of sub.products) {
            if (analytics[p.productId]) {
              analytics[p.productId].sold += p.quantity;
              analytics[p.productId].revenue += p.quantity * p.priceAtPurchase;
            }
          }
        }
      }
    }

    res.json({ analytics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching vendor analytics' });
  }
};
