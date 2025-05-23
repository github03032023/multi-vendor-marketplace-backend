const express = require("express");
const {
    registerVendor,
    vendorLogin,
    vendorLogout,
    getAllVendors,
    verifyVendorEmail
} = require("../controllers/vendorController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Register Vendor
router.post("/registerVendor", registerVendor);
router.post("/vendorLogin",  vendorLogin);
// Vendor Logout
router.post("/vendorLogout", authMiddleware, vendorLogout);
router.get("/getAllVendors", authMiddleware, getAllVendors);
// Verify Email
router.get('/verifyVendorEmail', verifyVendorEmail );


module.exports = router;