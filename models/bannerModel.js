const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  images: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      description: { type: String },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('banner', bannerSchema);
