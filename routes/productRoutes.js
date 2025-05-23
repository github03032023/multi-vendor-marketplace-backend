const express = require("express");
const {
    registerProduct,
    updateProductByCode,
    deleteProductByCode,
    getActiveProductsForVendor,
    getActiveProducts,
    deleteCloudinaryImage
} = require("../controllers/productController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Multer middleware for handling image uploads
// const upload = require('../config/multer');
const multer = require('multer');
const upload = multer();


// // Multer setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
// const upload = multer({ storage });



// Register Product with file upload
// router.post('/registerProduct', upload.array('images', 5), authMiddleware, registerProduct);
router.post('/registerProduct', authMiddleware,  upload.none(), registerProduct);

// Update Products based on productCode
router.put('/updateProduct/:productCode', authMiddleware, updateProductByCode);

router.delete('/deleteCloudinaryImage', authMiddleware,deleteCloudinaryImage);


// Delete product based on productCode
router.delete("/deleteProduct/:productCode", authMiddleware,  deleteProductByCode);
// Get all active products based on vendor name
router.get("/getAllActiveProducts/:vendorId", authMiddleware,  getActiveProductsForVendor);
// Get all active products in the db
router.get("/fetchAllProducts",  getActiveProducts);



// router.post("/uploadImageToCloudinary", upload.array('images', 5), uploadImagesToCloudinary);
module.exports = router;
