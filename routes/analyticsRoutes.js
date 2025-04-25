const express = require('express');

const {
    getRevenueData,
    getOrdersData,
    getProductPerformanceData
} = require('../controllers/analyticsController');

const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
//routes for analytics
router.get("/revenue", getRevenueData);
router.get("/orders", getOrdersData);
router.get("/product-performance", getProductPerformanceData);

module.exports = router;