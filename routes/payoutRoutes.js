const express = require('express');

const {
    getEligibleSubOrders,
    requestVendorPayout,
    processVendorPayout,
    getAllVendorPayoutRequests

} = require('../controllers/payoutController');

const router = express.Router();
const  authMiddleware = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer();

// To fetch eligible suborders for vendor payout
router.get("/vendor/getEligibleSubOrders", authMiddleware,getEligibleSubOrders);


// To fetch eligible suborders for vendor payout
router.get("/admin/getAllVendorPayoutRequests", authMiddleware,getAllVendorPayoutRequests);


// Vendor requests a payout
router.post("/vendor/vendorPayoutRequest", authMiddleware, upload.none(),requestVendorPayout);

// Admin takes action on the vendorPayoutRequest
router.post("/admin/processVendorPayout/:payoutId", authMiddleware,  processVendorPayout);

module.exports = router;
