const express = require('express');

const {
    createPayment,
    updatePaymentStatus,
    getPaymentDetails
} = require('../controllers/paymentController');

const router = express.Router();
const  authMiddleware = require('../middleware/authMiddleware');

// Create a new order
router.post('/createPayment', authMiddleware, createPayment);

router.patch('/:paymentId/status', authMiddleware, updatePaymentStatus);

router.get('/:paymentId', authMiddleware, getPaymentDetails);


module.exports = router;
