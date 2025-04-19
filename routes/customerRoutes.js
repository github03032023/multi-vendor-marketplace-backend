const express = require("express");
const {
    registerCustomer,
    userLogin,
    userLogout,
    getAllCustomers
} = require("../controllers/customerController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Register Customer
router.post("/registerCustomer", registerCustomer);
// User Login
router.post("/userLogin", userLogin);
// User Logout
router.post("/userLogout", authMiddleware, userLogout);
// Retrieve all users with customer role
router.post("/getAllCustomers", authMiddleware, getAllCustomers);

module.exports = router;
