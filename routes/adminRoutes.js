const express = require('express');
const router = express.Router();
const {
    getAllCustomers,
    getAllVendors,
    approveVendor,
    toggleActiveStatus,
    softDeleteUser,
    undeleteUser

} = require("../controllers/adminUserManagementController");

const authMiddleware = require('../middleware/authMiddleware');

// Get users and vendors
router.get('/getAllcustomers', authMiddleware,getAllCustomers);
router.get('/getAllvendors', authMiddleware,getAllVendors);

// Approve vendor
router.put('/vendor/approve/:id', authMiddleware,approveVendor);

// Toggle active status
router.put('/toggle-status/:role/:id',authMiddleware, toggleActiveStatus);

// Verify whether User or Vendor is having pending Payments
router.put('/delete/:role/:id', authMiddleware, softDeleteUser);

router.put('/undelete/:role/:id', authMiddleware, undeleteUser);


module.exports = router;

