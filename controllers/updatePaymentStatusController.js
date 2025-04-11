const Payment = require('../models/paymentModel');

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { newStatus } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.paymentStatus = newStatus;

    payment.statusHistory.push({
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    });

    await payment.save();

    res.status(200).json({ message: 'Payment status updated', payment });
  } catch (err) {
    console.error('Error updating payment status:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};




module.exports = {
    updatePaymentStatus
};