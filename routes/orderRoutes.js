const express = require('express');

const {
  createOrder,
  getOrderById,
  getConfirmOrderById,
  updateSubOrderStatus,
  getOrdersByCustomer,
  // cancelSubOrder,
  getOrderByIdForAnalytics
} = require('../controllers/orderController');

const router = express.Router();
const  authMiddleware = require('../middleware/authMiddleware');

// Create a new order
router.post('/createOrder', authMiddleware, createOrder);

// Get order by ID
router.get('/:id', authMiddleware, getOrderById);

// Get order by ID
router.get('/confirmOrder/:id', authMiddleware, getConfirmOrderById);


// Get order by ID for Analytics
router.get('/analytics/:orderId', authMiddleware, getOrderByIdForAnalytics);

// Update sub-order status (vendor/admin)
router.patch('/suborder/status', authMiddleware, updateSubOrderStatus);

// Get all orders by customer
router.get('/customer/:customerId', authMiddleware, getOrdersByCustomer);

// Cancel a specific suborder
// router.patch('/:orderId/suborder/:subOrderId/cancel', authMiddleware, cancelSubOrder);

module.exports = router;
