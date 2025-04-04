const VendorModel = require("../models/vendorModel");
const { validateAddresses } = require('../validators/addressValidator');
const { validateCompanyDetails, validateBankAccount } = require('../validators/companyValidator');
const { encryptPassword, comparePassword } = require("../utilities/passwordUtilities");
const jwt = require("jsonwebtoken");

//Register Vendor
const registerVendor = async (req, res) => {
    const { name, email, password, confirmpassword, phone, homeaddress, companyDetails, bankAccount } = req.body

    if (!name || !email || !password || !confirmpassword || !phone || !companyDetails || !bankAccount) {
        return res.status(400).json({ error: "All fields are required." });
    }

    if (password !== confirmpassword) {
        return res.status(400).json({ error: "Passwords doesnot match." });
    }

    // Validate company address
    if (!validateAddresses(homeaddress)) {
        return res.status(400).json({ error: "Address details missing." });
    }

    // Validate company details
    if (!validateCompanyDetails(companyDetails)) {
        return res.status(400).json({ error: "Invalid company details." });
    }

    // Validate bank account details
    if (!validateBankAccount(bankAccount)) {
        return res.status(400).json({ error: "Invalid bank account details." });
    }

    try {
        let vendor = await VendorModel.findOne({ email });
        if (vendor) return res.status(400).json({ message: "Vendor Already exists" });

        // bcrypt: password hashing algorithm used to hash password before saving to DB
        const encryptedPassword = await encryptPassword(password);

        vendor = new VendorModel({ name, email, password: encryptedPassword, phone, homeaddress, companyDetails, bankAccount })

        await vendor.save()
        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign(
            { vendorId: vendor?._id},
            jwtSecret,
            { expiresIn: '5d' });

        if(vendor) {
            return res.status(200).json({
                token,
                vendor: { id: vendor._id, name, email, phone, homeaddress, companyDetails, bankAccount },
                message: "Vendor Registered successfully"
                 });
        }

    } catch (err) {

        res.status(500).json({ message: "Server Error", error: err.message });

    }
};

// Vendor Login
const vendorLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please enter email and password." });
        }
        const vendorFound = await VendorModel.findOne({ email: email }).lean();
        if (!vendorFound) {
            return res.status(400).json({ error: "Vendor Not Found." });
        }
        const passwordMatch = await comparePassword(password, vendorFound.password);
        console.log(passwordMatch);

        if (!passwordMatch) {
            return res.staus(400).json({ error: "Passwords doesnot match." });
        } else {
            delete vendorFound.password;

            // creating a jwt token for authentication purposes
            const jwtSecret = process.env.JWT_SECRET;
            const token = jwt.sign(
                { vendorId: vendorFound?._id},
                jwtSecret,
                { expiresIn: '5d' }
            )

            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "Vendor Login successfully",
                token: token,
                vendor: {id: vendorFound._id, name: vendorFound.name, email, homeaddress : vendorFound.homeaddress }
            });
        }
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });

    }

};

// Simple Log Off. Need to update Code
const vendorLogout = async (req, res) => {
    try {
        // Simply ask frontend to clear token
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: "Logout failed" });
    }
};



// Display all Vendors
const getAllVendors = async (req, res) => {
    try {
        // Check for valid vendor authentication
        if (!req.vendorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or missing token",
            });
        }

        // Fetch Vendors with only the 'name', 'email', and 'phone' fields
        const vendors = await VendorModel.find()
                                             .select('name email phone homeaddress companyDetails -_id');

        // Check if any customers were found
        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No Vendor found",
            });
        }

        // Respond with the retrieved cendor data
        res.status(200).json({
            success: true,
            vendors: vendors,
        });
    } catch (error) {
        console.error("Error in getAllVendors:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    registerVendor,
    vendorLogin,
    vendorLogout,
    getAllVendors
};