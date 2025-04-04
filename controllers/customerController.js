const CustomerModel = require("../models/customerModel");
const { encryptPassword, comparePassword } = require("../utilities/passwordUtilities");
const {validateAddresses} = require('../validators/addressValidator.js');

const jwt = require("jsonwebtoken");

const registerCustomer = async (req, res) => {
    try {
        const { name, email, password, confirmpassword, phone, age, gender, addresses, role } = req.body;
        console.log("Request Body-",req.body)

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
            name, email, password: encryptedPassword, phone, age, gender,addresses, role
        });

        const savedCustomer = await newCustomer.save();
       
        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign(
                            { userId: savedCustomer?._id, role: role },
                            jwtSecret,
                            { expiresIn: '5d' }
                        )
        if (savedCustomer) {
            delete savedCustomer.password;
            return res.status(200).json({
                token,
                user: {id: savedCustomer._id, name, email, phone},
                message: "Customer Registered successfully"
                 });
        }
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });

    }
}


const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please enter email and password." });
        }
        const userFound = await CustomerModel.findOne({ email: email }).lean();
        if (!userFound) {
            return res.status(400).json({ error: "User Not Found." });
        }
        const passwordMatch = await comparePassword(password, userFound.password);
        console.log(passwordMatch);

        if (!passwordMatch) {
            return res.staus(400).json({ error: "Passwords doesnot match." });
        } else {
            delete userFound.password;


            // Ensure the user's role is present
            const role = userFound.role;
            if (!role) {
                return res.status(400).json({ error: " Roles not defined." });
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
                user: {id: userFound._id, name: userFound.name, email, role:userFound.role }
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
    userLogin,
    userLogout,
    getAllCustomers

};