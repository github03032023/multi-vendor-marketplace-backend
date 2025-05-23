
const mongoose = require('mongoose');

const vendorPayoutModel = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'vendors', required: true },
    amount: { type: Number, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    subOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true // ID of the suborder within the order.subOrders array
    },
    payoutMethod: {
      type: String,
      enum: ['UPI', 'BankTransfer', 'Cash', 'Other'],
      required: true,
    },
    transactionReference: String,
    notes: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
      default: 'Pending',
    },
    requestedByVendor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VendorPayout', vendorPayoutModel);
