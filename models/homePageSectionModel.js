const mongoose = require('mongoose');

const homepageSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  images: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      description: { type: String, required: true },
      linkedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'products', default: null  },
    },
  ],
});

module.exports = mongoose.model('homepagesection', homepageSectionSchema);
