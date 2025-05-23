const VendorModel = require("../models/vendorModel");
const CustomerModel = require("../models/customerModel");
const Notification = require("../models/notificationModel.js");
const { validateAddresses } = require('../validators/addressValidator');
const { validateCompanyDetails, validateBankAccount } = require('../validators/companyValidator');
const { encryptPassword, comparePassword } = require("../utilities/passwordUtilities");
const jwt = require("jsonwebtoken");
const sendEmail = require('../config/sendEmail.js');

//Register Vendor
const registerVendor = async (req, res) => {
    console.log("Request -", req.body);
    const { name, email, password, confirmpassword, gender, age, phone, homeaddress, companyDetails, bankAccount } = req.body

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

        vendor = new VendorModel({ name, email, password: encryptedPassword, gender, age, phone, homeaddress, companyDetails, bankAccount })

        await vendor.save()
        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign(
            { vendorId: vendor?._id },
            jwtSecret,
            { expiresIn: '5d' });

        //Email Trigger Settings
        const verifyUrl = `${process.env.CLIENT_URL}/verifyVendorEmail?token=${token}`;

        console.log("savedVendorr-", vendor.email);
        console.log("savedVendor Name-", vendor.name);
        console.log("url-", verifyUrl);
        const html = `
 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
  <div style="text-align: center;">
    <img src="https://i.ibb.co/J5xw8qT/smartbuy-logo.png" alt="SmartBuy Logo" style="width: 150px; margin-bottom: 20px;" />
    <h2 style="color: #4CAF50;">Welcome to SmartBuy, ${vendor.name}!</h2>
    <p style="font-size: 16px;">We're excited to have you join our growing network of trusted vendors.</p>
    <p style="font-size: 18px; font-style: italic; margin: 20px 0; color: #2196F3;">
      "Reach more customers. Grow your business. Sell smarter with SmartBuy."
    </p>
    <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">
      Verify Your Email
    </a>
    <p style="margin-top: 30px; color: #555;">
      As a SmartBuy vendor, you gain access to powerful tools, marketing support, and a massive customer base eager to discover what you offer.
    </p>
    <hr style="margin: 40px 0;">
    <p style="font-size: 14px; color: #999;">
      SmartBuy Marketplace • Partnering for Success
    </p>
  </div>
</div>
`;

        if (vendor) {
            await sendEmail({
                to: vendor.email,
                subject: '🎉 Welcome to SmartBuy! Please Verify Your Email',
                html,
            });

        }

        if (vendor) {
            return res.status(200).json({
                token,
                vendor: { id: vendor._id, name, email, phone, homeaddress, companyDetails, bankAccount },
                message: "Vendor details submitted. Please verify your email by clicking a link, sent to your registered email."
            });
        }

    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Vendor Registration failed." });
    }
};

// Vendor Login
const vendorLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Request is ", req.body);

        if (!email || !password) {
            return res.status(400).json({ error: "Please enter email and password." });
        }
        // Add checks: isActive, isDeleted, isApproved
        const vendorFound = await VendorModel.findOne({
            email: email,
            isActive: true,
            isDeleted: false,
            isApproved: true
        }).lean();

        if (!vendorFound) {
            return res.status(403).json({
                error: "Unable to log in. The vendor account may be inactive, deleted, or pending admin approval. Please contact support for assistance."
            });
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
                { vendorId: vendorFound?._id },
                jwtSecret,
                { expiresIn: '5d' }
            )

            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "Vendor Login successfully",
                token: token,
                vendor: { id: vendorFound._id, name: vendorFound.name, email, homeaddress: vendorFound.homeaddress }
            });
        }
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });

    }

};

const verifyVendorEmail = async (req, res) => {
    const token = req.query.token;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded.vendorId-",decoded.vendorId);
        const vendor = await VendorModel.findById(decoded.vendorId);
        if (!vendor) return res.status(404).send('Vendor details not found');

        vendor.isVerified = true;
        await vendor.save();
        const adminData = await CustomerModel.findOne({ role: "admin", isDeleted: false, isActive: true }).select('_id name email');
        console.log("adminData.name-",adminData.name);
        console.log("adminData._id-",adminData._id);
        const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
    <div style="text-align: center;">
    <img src="https://i.ibb.co/J5xw8qT/smartbuy-logo.png" alt="SmartBuy Logo" style="width: 150px; margin-bottom: 20px;" />
    <h6 style="color: #4CAF50;">Dear ${adminData.name}!</h6><br/>
    <p style="font-size: 16px;">Please approve the newly registered vendor ${vendor.name}. </p>
    <p style="font-size: 18px; font-style: italic; margin: 20px 0; color: #2196F3;">
      "Reach more customers. Grow your business. Sell smarter with SmartBuy."
    </p>
    </div>
    </div>
    `;
        if (vendor.isVerified) {
            
            if (adminData) {
                await sendEmail({
                    to: adminData.email,
                    subject: 'Please approve the newly registered vendor',
                    html,
                });

                await Notification.create({
                    userId: adminData._id,
                    userType: "customers",
                    type: `Approve New Vendor`,
                    message: `Please approve the newly registered vendor ${vendor.name}, whose email verified on ${new Date()}.`,
                });

            }
        }

        res.send('Email verified! Please wait for Admin approval before login.');
    } catch (err) {
        res.status(400).send('Invalid or expired token');
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
    getAllVendors,
    verifyVendorEmail
};