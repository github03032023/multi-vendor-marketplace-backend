// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
    getCommission,
    updateCommission

} = require("../controllers/adminPlatformCommissionController");

const authMiddleware = require('../middleware/authMiddleware');


router.get('/admin/getCommissionPercent', authMiddleware, getCommission);
router.put('/admin/updateCommissionPercent', authMiddleware, updateCommission);

module.exports = router;
