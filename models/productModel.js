const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0.01
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendors', // References the Vendor model
        required: true,
    },
    images: [
        {
            url: {
                type: String,
                required: true,
            },
            altText: {
                type: String,
                trim: true,
            },
        },
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const ProductModel = mongoose.model('products', productSchema);

module.exports = ProductModel;