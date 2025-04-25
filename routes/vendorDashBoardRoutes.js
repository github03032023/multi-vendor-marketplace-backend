const express = require('express');

const {
    getOrdersByStatus,
    updateSubOrderStatus,
    approveReturn,
    getOrderAndPaymentHistory,
    getVendorAnalytics
} = require('../controllers/vendorDashboardController');

const router = express.Router();

const { authMiddleware } = require('../middleware/authMiddleware');

// Get vendor orders by status
router.get('/getOrdersByStatus', getOrdersByStatus);

// Update suborder status (e.g., mark as Shipped, Cancelled)
router.patch('/:orderId/suborder/:subOrderId/status', updateSubOrderStatus);

// Approve returned order (Stripe refund integration)
router.post('/:orderId/suborder/:subOrderId/approve-return', approveReturn);

// Get order and payment history
router.get('/:orderId/history', getOrderAndPaymentHistory);

// Vendor analytics
router.get('/analytics',  getVendorAnalytics);

module.exports = router;
