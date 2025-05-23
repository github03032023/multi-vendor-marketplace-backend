const express = require("express");
// const multer = require('multer');
// const upload = multer();
const upload = require('../config/multer');
const {
    reviewProduct,
    getReviewedProducts    
} = require("../controllers/productReviewController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Review a Product
router.post("/reviewProduct",authMiddleware, upload.single('image'), reviewProduct);

// Get all the Product Reviews
router.get("/getReviewedProducts/:productCode",  getReviewedProducts);

module.exports = router;


