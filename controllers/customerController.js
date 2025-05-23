const CustomerModel = require("../models/customerModel");
const { encryptPassword, comparePassword } = require("../utilities/passwordUtilities");
const { validateAddresses } = require('../validators/addressValidator.js');

const jwt = require("jsonwebtoken");
const sendEmail = require('../config/sendEmail.js');

const registerCustomer = async (req, res) => {
    try {
        const { name, email, password, confirmpassword, phone, age, gender, addresses, role } = req.body;
        console.log("Request Body-", req.body)

        if (!name || !email || !password || !confirmpassword || !phone || !role) {
            return res.status(400).json({ error: "All fields are required." });
        }


        if (password !== confirmpassword) {
            return res.status(400).json({ error: "Passwords doesnot match." });
        }

        if (!validateAddresses(addresses)) {
            return res.status(400).json({ error: "Address details missing." });
        }

        const customerExist = await CustomerModel.findOne({ email });
        if (customerExist) {
            return res.status(400).json({ error: "Email already exists." });
        }
        // bcrypt: password hashing algorithm used to hash password before saving to DB
        const encryptedPassword = await encryptPassword(password);
        const newCustomer = new CustomerModel({
            name, email, password: encryptedPassword, phone, age, gender, addresses, role
        });

        const savedCustomer = await newCustomer.save();

        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign(
            { userId: savedCustomer?._id, role: role },
            jwtSecret,
            { expiresIn: '5d' }
        )
        //Email Trigger Settings
        const verifyUrl = `${process.env.CLIENT_URL}/verifyEmail?token=${token}`;

        console.log("savedCustomer-", savedCustomer.email);
        console.log("savedCustomer Name-", savedCustomer.name);

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center;">
          <img src="https://multi-vendor-marketplace-backend.onrender.com/public/images/smartBuy.png" alt="SmartBuy Logo" style="width: 150px; margin-bottom: 20px;" />
            <h2 style="color: #4CAF50;">Welcome to SmartBuy, ${savedCustomer.name}!</h2>
            <p style="font-size: 16px;">Your one-stop shop for everything you love — and more.</p>
            <p style="font-size: 18px; font-style: italic; margin: 20px 0; color: #FF5722;">
              "Why pay more? Shop smart, live smarter."
            </p>
            <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Verify Your Email
            </a>
            <p style="margin-top: 30px; color: #555;">
              We're thrilled to have you on board. Discover exciting deals, exclusive offers, and a shopping experience like never before.
            </p>
            <hr style="margin: 40px 0;">
            <p style="font-size: 14px; color: #999;">
              SmartBuy Marketplace • Your Favorite Online Destination
            </p>
          </div>
        </div>
      `;
      
        await sendEmail({
            to: savedCustomer.email,
            subject: '🎉 Welcome to SmartBuy! Please Verify Your Email',
            html,
        });

        if (savedCustomer) {
            delete savedCustomer.password;
            return res.status(200).json({
                token,
                user: { id: savedCustomer._id, name, email, phone },
                message: "Customer Registered successfully. Please verify your email by clicking a link, sent to your registered email."
            });
        }
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Registration failed." });

    }
}

const verifyEmail = async (req, res) => {
    const token = req.query.token;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await CustomerModel.findById(decoded.userId);
        if (!user) return res.status(404).send('User not found');

        user.isVerified = true;
        await user.save();

        res.send('Email verified! You can now log in.');
    } catch (err) {
        res.status(400).send('Invalid or expired token');
    }
};


const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please enter email and password." });
        }

        const userFound = await CustomerModel.findOne({
            email: email,
            isActive: true,
            isDeleted: false
        }).lean();

        if (!userFound) {
            return res.status(400).json({ error: "Unable to log in. The account may be inactive, deleted, or pending admin approval. Please contact support for assistance." });
        }

        const passwordMatch = await comparePassword(password, userFound.password);
        console.log(passwordMatch);

        if (!passwordMatch) {
            return res.status(400).json({ error: "Passwords doesnot match." });
        } else {
            delete userFound.password;

            // Ensure the user's role is present
            const role = userFound.role;
            if (!role) {
                return res.status(400).json({ error: " Roles not defined." });
            }
            
            if ((role ==='customer') && !userFound.isVerified) {
                return res.status(403).json({ success: false, message: 'Please verify your email to log in.' });
            }



            // creating a jwt token for authentication purposes
            const jwtSecret = process.env.JWT_SECRET;
            const token = jwt.sign(
                { userId: userFound?._id, role: role },
                jwtSecret,
                { expiresIn: '5d' }
            )

            return res.status(200).json({
                success: true,
                statusCode: 200,
                message: "User Login successfully",
                token: token,
                user: { id: userFound._id, name: userFound.name, email, role: userFound.role }
                //  user: customerFound
            });
        }
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });

    }

};

// Simple Log Off. Need to update Code
const userLogout = async (req, res) => {
    try {
        // Simply ask frontend to clear token
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: "Logout failed" });
    }
};


const updateCustomer = async (req, res) => {
    try {
      const { id } = req.params;
      const { phone, password, confirmpassword, addresses } = req.body;
  
      const customer = await CustomerModel.findById(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found." });
      }
  
      // Update phone if provided
      if (phone) {
        customer.phone = phone;
      }
  
      // Update password if provided
      if (password || confirmpassword) {
        if (!password || !confirmpassword) {
          return res.status(400).json({ error: "Both password and confirmpassword are required." });
        }
        if (password !== confirmpassword) {
          return res.status(400).json({ error: "Passwords do not match." });
        }
        customer.password = await encryptPassword(password);
      }
  
      // Update addresses if provided
      if (addresses) {
        if (!validateAddresses(addresses)) {
          return res.status(400).json({ error: "Invalid address format." });
        }
        customer.addresses = addresses;
      }
  
      const updatedCustomer = await customer.save();
  
      return res.status(200).json({
        message: "Customer profile updated successfully.",
        user: {
          id: updatedCustomer._id,
          name: updatedCustomer.name,
          email: updatedCustomer.email,
          phone: updatedCustomer.phone,
          addresses: updatedCustomer.addresses,
        }
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update customer." });
    }
  };

  const getCustomerDetailsById = async (req, res) => {
    try {
      const customerId = req.params.id;
  
      const customer = await CustomerModel.findById(customerId).select("phone addresses");
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
  
      res.status(200).json(customer);
    } catch (error) {
      console.error("Fetch customer error:", error);
      res.status(500).json({ error: "Server error while fetching customer data" });
    }
  };
  


const getAllCustomers = async (req, res) => {
    try {
        // Check for valid user authentication
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or missing token",
            });
        }

        // Fetch customers with only the 'name', 'email', and 'phone' fields
        const customers = await CustomerModel.find({ role: "customer" })
            .select('name email phone -_id');

        // Check if any customers were found
        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No Customer found",
            });
        }

        // Respond with the retrieved customer data
        res.status(200).json({
            success: true,
            customers: customers,
        });
    } catch (error) {
        console.error("Error in getAllCustomers:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


module.exports = {
    registerCustomer,
    verifyEmail,
    userLogin,
    userLogout,
    updateCustomer,
    getCustomerDetailsById,
    getAllCustomers

};