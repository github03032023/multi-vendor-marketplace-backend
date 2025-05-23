const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'customers',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orders',
    required: true
  },
  subOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // ID of the suborder within the order.subOrders array
  },
  reason: {
    type: String,
    required: true,
    enum: ['Damaged item', 'Wrong size', 'Packaging issue', 'Other']
  },
  message: { type: String }, // Optional message for 'Other' reason
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  rejectionReason: { type: String }
}, { timestamps: true });
  // createdAt: {
  //   type: Date,
  //   default: Date.now
  // }
// });

const ReturnRequestModel = mongoose.model('returnrequests', returnRequestSchema);
module.exports = ReturnRequestModel;
