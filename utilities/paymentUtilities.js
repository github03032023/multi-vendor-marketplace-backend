const OrderModel = require('../models/orderModel.js');
const PaymentModel = require('../models/paymentModel.js');

// Check if a user has pending payments (customer or vendor perspective)
const hasPendingPayments = async (userId, role) => {
    try {
        if (role === 'customer') {
            console.log("Inside Customer Role of hasPendingPayments");
            const orders = await OrderModel.find({ customerId: userId }).populate('paymentId');
            return orders.some(order => order.paymentId?.paymentStatus === 'Pending');
        }

        if (role === 'vendor') {
            console.log("Inside Vendor Role of hasPendingPayments");
            const orders = await OrderModel.find({ 'subOrders.vendorId': userId }).populate('paymentId');
            return orders.some(order =>
                order.paymentId?.paymentStatus === 'Pending' &&
                order.subOrders.some(sub => sub.vendorId.toString() === userId.toString())
            );
        }

        return false;
    } catch (error) {
        console.error(`❌ Error checking pending payments for ${role} ${userId}:`, error);
        throw new Error('Error checking pending payments');
    }
};

module.exports = {hasPendingPayments};
