const express = require("express");
const {
    registerProduct,
    updateProductByCode,
    deleteProductByCode,
    getActiveProductsForVendor,
    getActiveProducts
} = require("../controllers/productController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');


const multer = require('multer');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });



// Register Product with file upload
router.post('/registerProduct', upload.array('images', 5), authMiddleware, registerProduct);
// router.post("/registerProduct", authMiddleware, registerProduct);

// Update Products based on productCode
router.put('/updateProduct/:productCode', upload.array('images', 5), authMiddleware, updateProductByCode);
// router.put("/updateProduct/:productCode", authMiddleware,  updateProductByCode);

// Delete product based on productCode
router.put("/deleteProduct/:productCode", authMiddleware,  deleteProductByCode);
// Get all active products based on vendor name
router.get("/getAllActiveProducts/:vendorName", authMiddleware,  getActiveProductsForVendor);
// Get all active products in the db
router.get("/fetchAllProducts",  getActiveProducts);

module.exports = router;
