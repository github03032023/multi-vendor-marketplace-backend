const CustomerModel = require('../models/customerModel');
const PaymentModel = require('../models/paymentModel.js');
const VendorModel = require('../models/vendorModel.js');
const Notification = require('../models/notificationModel.js');
const { hasPendingPayments } = require("../utilities/paymentUtilities.js");
const sendEmail = require('../config/sendEmail.js');
// Get all customers
const getAllCustomers = async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';

    // console.log("includeDeleted-",includeDeleted);

    const filter = { role: 'customer', isVerified: true };
    if (!includeDeleted) {
        filter.isDeleted = false;
    }

    // console.log("filter Customers-",filter);
    const customers = await CustomerModel.find(filter);
    // console.log("customers List-",customers);
    res.json(customers);
};
// Get all vendors
const getAllVendors = async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';
    console.log("includeDeleted-", includeDeleted);
    const filter = { isVerified: true };
    if (!includeDeleted) {
        filter.isDeleted = false;
    }
    console.log("filter Vendors-", filter);

    const vendors = await VendorModel.find(filter);
    console.log("vendor List-", vendors);
    res.json(vendors);
};
// Approve a vendor
const approveVendor = async (req, res) => {
    const { id } = req.params;

    try {
        const vendor = await VendorModel.findById(id);

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        if (vendor.isDeleted) {
            return res.status(400).json({ message: 'Cannot approve a deleted vendor.' });
        }

        vendor.isApproved = true;
        await vendor.save();
        const adminData = await CustomerModel.findOne({ role: "admin", isDeleted: false, isActive: true }).select('_id name email');

        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
  <div style="text-align: center;">
    <img src="https://multi-vendor-marketplace-backend.onrender.com/public/images/smartBuy.png" alt="SmartBuy Logo" style="width: 150px; margin-bottom: 20px;" />
    <h2 style="color: #4CAF50;">Welcome to SmartBuy, ${vendor.name}!</h2>
    
    <p style="font-size: 16px;">We're thrilled to officially welcome you as an approved vendor on our platform. Please login
    to explore more.</p>
    
    <p style="font-size: 18px; font-style: italic; margin: 20px 0; color: #2196F3;">
      "Reach more customers. Grow your business. Sell smarter with SmartBuy."
    </p>
   
    <p style="margin-top: 30px; color: #555;">
      You now have access to product management tools, order management, and Payment Processing resources to help grow your business on SmartBuy.
    </p>

    <p style="margin-top: 20px; color: #555;">
      If you need assistance or have questions, feel free to reach out to our vendor support team:
    </p>

    <div style="background-color: #f9f9f9; padding: 15px; margin-top: 10px; border-radius: 8px; display: inline-block; text-align: left;">
      <p style="margin: 5px 0;"><strong>Admin Contact:</strong></p>
      <p style="margin: 5px 0;">📧 <strong>Email:</strong> ${adminData.email}</p>
      <p style="margin: 5px 0;">📞 <strong>Phone:</strong> ${adminData.phone}</p>
      <p style="margin: 5px 0;"> For technical assistance , please contact <strong>smartbuymarketplace@gmail.com </strong></p>
    </div>

    <hr style="margin: 40px 0;">
    
    <p style="font-size: 14px; color: #999;">
      SmartBuy Marketplace • Empowering Vendors Every Day
    </p>
  </div>
</div>
`;


        if (vendor.isApproved) {
          
                await sendEmail({
                    to: vendor.email,
                    subject: 'Your registration with SmartBuy is successful',
                    html,
                });

                await Notification.create({
                    userId: vendor._id,
                    userType: "vendors",
                    type: `Vendor Registration Approved`,
                    message: `Welcome to SmartBuy. Your credentials have been approved by the Admin on ${new Date()}. Pl.`,
                });
        }

        res.status(200).json({ message: '✅ Vendor approved successfully.' });
    } catch (error) {
        console.error('Error approving vendor:', error);
        res.status(error.status || 500).json({ error: error.message || '❌ Server error while approving vendor.' });
    }
};



// Toggle user or vendor active status
const toggleActiveStatus = async (req, res) => {
    const { role, id } = req.params;
    let model = role === 'vendor' ? VendorModel : CustomerModel;

    const record = await model.findById(id);
    if (!record) return res.status(404).json({ error: 'Not found' });

    record.isActive = !record.isActive;
    await record.save();

    res.json({ message: `${role} ${record.isActive ? 'activated' : 'deactivated'} successfully.` });
};


const softDeleteUser = async (req, res) => {
    const { id, role } = req.params;
    console.log("Req Params-", req.params);
    try {
        const hasPending = await hasPendingPayments(id, role);
        console.log("value of hasPending-", hasPending);
        if (hasPending) {
            return res.status(400).json({ message: `Cannot delete ${role} with pending payments.` });
        }

        if (role === 'customer') {
            await CustomerModel.findByIdAndUpdate(id, { isDeleted: true, isActive: false });
        } else if (role === 'vendor') {
            await VendorModel.findByIdAndUpdate(id, { isDeleted: true, isActive: false });
        } else {
            return res.status(400).json({ message: 'Invalid role' });
        }
        res.status(200).json({ message: `${role} marked as deleted.` });
    } catch (error) {
        console.error('Error while deleting :', error);
        res.status(error.status || 500).json({ error: error.message || '❌Server error while restoring.' });
    }
};

const undeleteUser = async (req, res) => {
    const { role, id } = req.params;

    try {
        let updated;
        if (role === 'customer') {
            updated = await CustomerModel.findByIdAndUpdate(id, { isDeleted: false, isActive: true }, { new: true });
        } else if (role === 'vendor') {
            updated = await VendorModel.findByIdAndUpdate(id, { isDeleted: false, isActive: true }, { new: true });
        } else {
            return res.status(400).json({ message: 'The loggedIn User has an invalid role' });
        }

        if (!updated) return res.status(404).json({ message: `${role} not found` });

        res.json({ message: `${role} restored successfully and can logIn now`, data: updated });
    } catch (error) {
        console.error('Error restoring the deleted person:', error);
        res.status(error.status || 500).json({ error: error.message || '❌Server error while restoring.' });
    }
};




module.exports = {
    getAllCustomers,
    getAllVendors,
    approveVendor,
    toggleActiveStatus,
    softDeleteUser,
    undeleteUser
};