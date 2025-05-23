const express = require("express");
const {
    addProductsToWishlist,
    getWishlist,
    deleteWishlist,

} = require("../controllers/wishlistController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Add to Wishlist
router.post("/addProductsToWishlist",authMiddleware,  addProductsToWishlist);

// Get Wishlist
router.get("/getWishlist",authMiddleware,  getWishlist);

// delete Wishlist
router.delete("/deleteWishlist/:id",authMiddleware,  deleteWishlist);


module.exports = router;