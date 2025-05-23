const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customers', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
}, { timestamps: true });

module.exports = mongoose.model('wishlist', wishlistSchema);
