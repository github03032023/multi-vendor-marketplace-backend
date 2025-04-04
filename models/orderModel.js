const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers',
        required: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'payments',
        required: true
    },
    subOrders: [{
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'vendors',
            required: true
        },
        products: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            // price: {
            //     type: Number,
            //     required: true
            // }

            priceAtPurchase: {
                type: Number,
                required: true,
                min: 0,
            },
        }],
        subTotal: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Processing'
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        street: { type: String },
        city: { type: String },
        state: { type: String ,required: true},
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    overallStatus: {
        type: String,
        enum: ['Processing', 'Partially Shipped', 'Completed', 'Cancelled'],
        default: 'Processing'
    }
}, {
    timestamps: true
});

const OrderModel = mongoose.model('Order', orderSchema);
module.exports = OrderModel;

