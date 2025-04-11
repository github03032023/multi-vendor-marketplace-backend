const express = require('express');

const {
  createOrder,
  getOrderById,
  updateSubOrderStatus,
  getOrdersByCustomer,
  cancelSubOrder
} = require('../controllers/orderController');

const router = express.Router();
const  authMiddleware = require('../middleware/authMiddleware');

// Create a new order
router.post('/createOrder', authMiddleware, createOrder);

// Get order by ID
router.get('/:id', authMiddleware, getOrderById);

// Update sub-order status (vendor/admin)
router.patch('/suborder/status', authMiddleware, updateSubOrderStatus);

// Get all orders by customer
router.get('/customer/:customerId', authMiddleware, getOrdersByCustomer);

// Cancel a specific suborder
router.patch('/:orderId/suborder/:subOrderId/cancel', authMiddleware, cancelSubOrder);

module.exports = router;
