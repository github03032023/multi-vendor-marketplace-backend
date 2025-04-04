const express = require("express");
const {
    registerProduct,
    updateProductByCode,
    deleteProductByCode,
    getActiveProducts
} = require("../controllers/productController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Register Product
router.post("/registerProduct", authMiddleware, registerProduct);
// Update Products based on productCode
router.put("/updateProduct/:productCode", authMiddleware,  updateProductByCode);
// Delete product based on productCode
router.put("/deleteProduct/:productCode", authMiddleware,  deleteProductByCode);
// Get all active products based on vendor name
router.get("/getAllActiveProducts/:vendorName", authMiddleware,  getActiveProducts);

module.exports = router;
