const express = require("express");
const {
    addToCart,
    removeFromCart,
    getCartItems,
    updateQuantity,
    clearCart

} = require("../controllers/cartController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Add Items to Customer Cart
router.post("/addToCart", authMiddleware, addToCart);

// Remove Items from Cart
router.post("/removeFromCart", authMiddleware, removeFromCart);

// GET Items from Cart
router.get("/getCartItems", authMiddleware, getCartItems);

// Update quantity in the backend
router.post('/updateQuantity', authMiddleware, updateQuantity);

// Clears cart in the backend
router.post('/clearCart', authMiddleware, clearCart);
module.exports = router;