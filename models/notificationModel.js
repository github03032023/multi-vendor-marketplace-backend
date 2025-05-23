const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userType',
      required: true, // The user who will receive this notification and dynamically selects either customer or vendor reference
    },
    userType: {
      type: String,
      required: true,
      enum: ['customers', 'vendors'], // Specifies which collection the user belongs to
    },
    type: {
      type: String,
      required: true, // Type of notification
    },
    message: {
      type: String,
      required: true, // The content of the notification
    },
    read: {
      type: Boolean,
      default: false, // Whether the notification has been read by the user
    },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('notifications', notificationSchema);

module.exports = Notification;
