const express = require("express");
const {
    registerVendor,
    vendorLogin,
    vendorLogout,
    getAllVendors
} = require("../controllers/vendorController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Register Vendor
router.post("/registerVendor", registerVendor);
router.post("/vendorLogin", authMiddleware, vendorLogin);
// Vendor Logout
router.post("/vendorLogout", authMiddleware, vendorLogout);
router.get("/getAllVendors", authMiddleware, getAllVendors);



module.exports = router;