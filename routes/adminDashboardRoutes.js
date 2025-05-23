const express = require('express');
const router = express.Router();
const {
    getFilteredOrders,
    getOrderStatusStats,
    cancelSubOrder,
    getOrdersById,
    searchOrders,
    adminAnalytics

} = require("../controllers/adminDashboardController");

const authMiddleware = require('../middleware/authMiddleware');

// Get Orders
router.get('/getFilteredOrders', authMiddleware,getFilteredOrders);


// GET status-stats for retrieving Order Status
router.get('/status-stats', authMiddleware, getOrderStatusStats);

// PATCH /api/orders/cancel-suborder/:subOrderId
router.patch('/cancelSuborder/:subOrderId', authMiddleware, cancelSubOrder);


// GEt Orders By ID
 router.get('/getOrdersById/:OrderId', authMiddleware, getOrdersById);



// Seach Orders
router.post('/orders/search',authMiddleware, searchOrders);

router.get('/analytics',authMiddleware, adminAnalytics);

module.exports = router;