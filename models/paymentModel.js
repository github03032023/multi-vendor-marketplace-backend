const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order', // Reference to the Order model
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'Stripe', 'PayPal', 'PhonePe'],
    required: true,
  },
  paymentDetails: {
    type: Map,
    of: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending',
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Create and export the Payment model
const Payment = mongoose.model('payments', paymentSchema);
module.exports = Payment;
