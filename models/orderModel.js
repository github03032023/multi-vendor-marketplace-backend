const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'customers',
    required: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'payments',
    default: null,
    // required: true,
  },
  subOrders: [{
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendors',
      required: true,
    },
    products: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true,
      },
      quantity: { type: Number, required: true },
      priceAtPurchase: { type: Number, required: true, min: 0 },
    }],
    subTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Return Requested', 'Returned', 'Return Rejected'],
      default: 'Processing',
    },
    statusHistory: [{
      status: String,
      updatedAt: { type: Date, default: Date.now },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'statusHistory.updatedByModel'
      },
      updatedByModel: {
        type: String,
        required: true,
        enum: ['customers', 'vendors'] 
      }
      
      // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    }],
    isVendorPaid: { type: Boolean, default: false },
    vendorEarnings: { type: Number, default: 0 },
    deliveredAt: { type: Date },
  }],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    street: String,
    city: String,
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  overallStatus: {
    type: String,
    enum: ['Processing', 'Paid', 'Partially Shipped', 'Partially Delivered', 'Shipped', 'Completed', 'Cancelled', 'Return Requested', 'Returned', 'Return Rejected'],
    default: 'Processing',
  },
  overallStatusHistory: [{
    status: String,
    updatedAt: { type: Date, default: Date.now },
     updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'overallStatusHistory.updatedByModel'
      },
      updatedByModel: {
        type: String,
        required: true,
        enum: ['customers', 'vendors'] 
      }
    // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  }],
}, {
  timestamps: true,
});


const OrderModel = mongoose.model('Order', orderSchema);
module.exports = OrderModel;