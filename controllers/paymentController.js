const Payment = require('../models/paymentModel');
const Order = require('../models/orderModel');

const createPayment = async (req, res) => {
  try {
    const {
      orderId,
      paymentMethod,
      paymentDetails,
      transactionId,
      updatedBy,
    } = req.body;

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Create payment record
    const payment = new Payment({
      order: orderId,
      paymentMethod,
      paymentDetails,
      transactionId,
      paymentStatus: 'Completed', // assuming payment was successful
      statusHistory: [
        {
          status: 'Completed',
          updatedBy,
        },
      ],
    });

    const savedPayment = await payment.save();

    // Update order with paymentId
    order.paymentId = savedPayment._id;
    await order.save();

    return res.status(200).json({ message: 'Payment successful', paymentId: savedPayment._id });
  } catch (error) {
    console.error('Payment creation failed:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
};


// Update payment status and push to history for Refunding (Return Items)
const updatePaymentStatus = async (req, res) => {
    try {
      const { paymentId } = req.params;
      const { newStatus, updatedBy } = req.body;
  
      const payment = await Payment.findByIdAndUpdate(paymentId, {
        paymentStatus: newStatus,
        $push: {
          statusHistory: {
            status: newStatus,
            updatedAt: new Date(),
            updatedBy: updatedBy
          }
        }
      }, { new: true });
  
      res.status(200).json({
        success: true,
        message: 'Payment status updated',
        payment
      });
    } catch (error) {
      console.error('Update Payment Status Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment status', error });
    }
  };
  
  // Get payment with history
  const getPaymentDetails = async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await Payment.findById(paymentId).populate('order').populate('statusHistory.updatedBy');
  
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
  
      res.status(200).json({ success: true, payment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get payment details', error });
    }
  };

module.exports = {
  createPayment,
  updatePaymentStatus,
  getPaymentDetails
};
