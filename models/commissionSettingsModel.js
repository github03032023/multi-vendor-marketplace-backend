const mongoose = require('mongoose');

const commissionSettingsSchema = new mongoose.Schema({
  commissionPercent: {
    type: Number,
    required: true,
    default: 5, // default to 5%
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('commissionSettings', commissionSettingsSchema);
