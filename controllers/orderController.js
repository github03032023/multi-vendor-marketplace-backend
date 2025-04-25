
const Order = require('../models/orderModel');

const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      subOrders,
      totalAmount,
      shippingAddress,
      updatedBy 
    } = req.body;

    // Set initial history per subOrder
    const subOrdersWithHistory = subOrders.map(sub => ({
      ...sub,
      status: 'Processing',
      statusHistory: [{ status: 'Processing', updatedBy }]
    }));


    // Create the order first without paymentId (null)
    const order = new Order({
      customerId,
      subOrders : subOrdersWithHistory,
      totalAmount,
      shippingAddress,
      paymentId: null, // will be updated after payment
      overallStatus: 'Processing',
      overallStatusHistory: [
        {
          status: 'Processing',
          updatedBy: customerId, 
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

  // Can be used by Vendor to update status to Shipped
  // Can be used by Delivery Person to update status to Delivered
  // Not Used for Cancel Purposes here as it needs specific validation
  const updateSubOrderStatus = async (req, res) => {
    try {
      const { orderId, vendorId, status, updatedBy } = req.body;
  
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
  
      const subOrder = order.subOrders.find(sub => sub.vendorId.toString() === vendorId);
      if (!subOrder) return res.status(404).json({ error: 'Sub-order not found' });
  
      subOrder.status = status;

        // maintain suborder history
        subOrder.statusHistory.push({
            status,
            updatedAt: new Date(),
            updatedBy,
          });

       // Determine overall order status based on all sub-orders
    const allStatuses = order.subOrders.map(so => so.status);

    if (allStatuses.every(s => s === 'Delivered')) {
      order.overallStatus = 'Completed';
    } else if (allStatuses.every(s => s === 'Shipped')) {
      order.overallStatus = 'Shipped';
    } else if (allStatuses.some(s => s === 'Shipped' || s === 'Delivered')) {
      order.overallStatus = 'Partially Shipped';
    } else {
      order.overallStatus = 'Processing'; // fallback
    }

    // Add status history for overallStatus
    order.overallStatusHistory.push({
      status: order.overallStatus,
      updatedAt: new Date(),
      updatedBy,
    });

  
      await order.save();
      res.json(order);
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


    // Can be used by Vendor or User to update Status to Cancelled
  const cancelSubOrder = async (req, res) => {
    const { orderId, subOrderId, updatedBy } = req.params;
    // const userId = req.user._id;
  
    try {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });
  
      const subOrder = order.subOrders.id(subOrderId);
      if (!subOrder) return res.status(404).json({ message: 'SubOrder not found' });
  
      // Prevent cancellation if already delivered or cancelled
      if (subOrder.status === 'Delivered' || subOrder.status === 'Cancelled') {
        return res.status(400).json({ message: 'SubOrder cannot be cancelled' });
      }
  
      subOrder.status = 'Cancelled';
      subOrder.statusHistory.push({
        status: 'Cancelled',
        updatedAt: new Date(),
        updatedBy: updatedBy,
      });
  
      // Update overallStatus of the Order to Cancelled, if all subOrders are cancelled
      const allCancelled = order.subOrders.every(so => so.status === 'Cancelled');
      if (allCancelled) {
        order.overallStatus = 'Cancelled';
        order.overallStatusHistory.push({
          status: 'Cancelled',
          updatedAt: new Date(),
          updatedBy: updatedBy,
        });
      }
  
      await order.save();
  
      res.status(200).json({ message: 'SubOrder cancelled successfully', order });
    } catch (error) {
      console.error('Cancel SubOrder Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

module.exports = {
  createOrder,
  getOrderById,
  updateSubOrderStatus,
  getOrdersByCustomer,
  cancelSubOrder
};












