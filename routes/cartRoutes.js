const express = require("express");
const {
    addToCart,
    removeFromCart

} = require("../controllers/cartController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Add Items to Customer Cart
router.post("/addToCart", authMiddleware, addToCart);

// Remove Items from Cart
router.post("/removeFromCart", authMiddleware, removeFromCart);

module.exports = router;
