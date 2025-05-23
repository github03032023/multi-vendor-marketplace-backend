const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customers', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true },
  image: {
    url: { type: String },
    publicId: { type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('productreview', reviewSchema);
