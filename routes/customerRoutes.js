const express = require("express");
const {
    registerCustomer,
    verifyEmail,
    userLogin,
    userLogout,
    updateCustomer,
    getCustomerDetailsById,
    getAllCustomers
} = require("../controllers/customerController");

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Register Customer
router.post("/registerCustomer", registerCustomer);
// Verify Email
router.get('/verifyEmail', verifyEmail );
// User Login
router.post("/userLogin", userLogin);
// User Logout
router.post("/userLogout", authMiddleware, userLogout);
// Retrieve all users with customer role
router.post("/getAllCustomers", authMiddleware, getAllCustomers);

router.put("/updateCustomer/:id", authMiddleware, updateCustomer);
router.get("/getCustomerDetailsById/:id", authMiddleware, getCustomerDetailsById);


module.exports = router;
