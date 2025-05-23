const express = require('express');
const router = express.Router();
const { getUserOrders, requestReturn, fetchRequestReturnDetails } = require('../controllers/returnRequestController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/orders', authMiddleware, getUserOrders);
router.post('/orders/return', authMiddleware, requestReturn);
router.get('/order/:orderId/suborder/:subOrderId/fetchReturnRequestDetails', authMiddleware, fetchRequestReturnDetails);

module.exports = router;
