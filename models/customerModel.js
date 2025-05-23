const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    }
}, {
    timestamps: true,
});

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone:{
        type:Number,
        required: true
    },
    age: {
        type: Number,
        required: false
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: false
    },
    // Users can manage multiple addresses
    addresses: [{
        street: { type: String },
        city: { type: String },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
      }],
    role:{
        type: String,
        enum: ['customer', 'admin'],
        required: true
    },
    cart: [cartSchema],
    isVerified: { type: Boolean, default: false },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const CustomerModel = mongoose.model("customers", customerSchema);

module.exports = CustomerModel;