const express = require('express');

const {
    getOrdersByStatus,
    updateSubOrderStatus,
    approveReturn,
    rejectReturnbyVendor,
    getOrderAndPaymentHistory,
    getVendorAnalytics,
    getOrdersByVendor
} = require('../controllers/vendorDashboardController');

const router = express.Router();

const authMiddleware  = require('../middleware/authMiddleware');

// Get vendor orders by status
router.get('/getOrdersByStatus', getOrdersByStatus);

// Update suborder status (e.g., mark as Shipped, Cancelled)
router.patch('/:orderId/suborder/:subOrderId/status', updateSubOrderStatus);

// Approve returned order (Stripe refund integration)
router.patch('/order/:orderId/suborder/:subOrderId/approve-return', authMiddleware,approveReturn);


router.patch('/order/:orderId/suborder/:subOrderId/reject-return',authMiddleware,rejectReturnbyVendor);

// Get order and payment history
router.get('/:orderId/history', getOrderAndPaymentHistory);

// Vendor analytics
router.get('/analytics',  getVendorAnalytics);

// get orders based on 
router.get('/vendor/:vendorId', authMiddleware, getOrdersByVendor);


module.exports = router;
