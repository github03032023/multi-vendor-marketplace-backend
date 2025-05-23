const express = require('express');

const {
    createPaymentIntent,
    confirmPayment
} = require('../controllers/paymentController');

const router = express.Router();
const  authMiddleware = require('../middleware/authMiddleware');

// router.patch('/:paymentId/status', authMiddleware, updatePaymentStatus);

// router.get('/:paymentId', authMiddleware, getPaymentDetails);


router.post("/create-intent", authMiddleware,createPaymentIntent);
router.post("/confirm", authMiddleware, confirmPayment);


module.exports = router;
