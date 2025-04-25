const Order = require('../models/orderModel');
const Payment = require('../models/paymentModel');
const Product = require('../models/productModel');
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

    subOrder.status = status;
    subOrder.statusHistory.push({ status, updatedBy: vendorId });

    await order.save();

    res.json({ message: 'SubOrder status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating suborder status' });
  }
};

exports.approveReturn = async (req, res) => {
  try {
    const { orderId, subOrderId } = req.params;
    const vendorId = req.user._id;

    const order = await Order.findById(orderId).populate('paymentId');
    const subOrder = order.subOrders.id(subOrderId);

    if (!subOrder || !subOrder.vendorId.equals(vendorId)) {
      return res.status(403).json({ message: 'Unauthorized to approve return' });
    }

    const payment = await Payment.findOne({ order: orderId });

    if (!payment || !payment.transactionId) {
      return res.status(404).json({ message: 'Valid payment not found for refund' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
    });

    payment.paymentStatus = 'Refunded';
    payment.statusHistory.push({ status: 'Refunded', updatedBy: vendorId });
    await payment.save();

    subOrder.status = 'Returned';
    subOrder.statusHistory.push({ status: 'Returned', updatedBy: vendorId });
    await order.save();

    res.json({ message: 'Return approved and refunded successfully', refund });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Error processing refund' });
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
