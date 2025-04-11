const Order = require('../models/orderModel');

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, subOrderIndex, newStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (subOrderIndex !== undefined) {
      // Update subOrder status
      const subOrder = order.subOrders[subOrderIndex];
      if (!subOrder) return res.status(400).json({ message: 'Invalid subOrder index' });
      //  Update SubOrder status
      subOrder.status = newStatus;
      // maintain suborder history
      subOrder.statusHistory.push({
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: req.user._id,
      });

    } else {
      // Update overall order status
      order.overallStatus = newStatus;
      order.overallStatusHistory.push({
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: req.user._id,
      });
    }

    await order.save();
    res.status(200).json({ message: 'Order status updated', order });

  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
