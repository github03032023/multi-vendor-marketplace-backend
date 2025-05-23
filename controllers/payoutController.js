const PayoutModel = require('../models/vendorPayoutModel');
const VendorModel = require("../models/vendorModel");
const OrderModel = require("../models/orderModel");
const Notification = require("../models/notificationModel.js");
const CustomerModel = require("../models/customerModel.js");
const sendEmail = require('../config/sendEmail.js');
const mongoose = require('mongoose');

const { v4: uuidv4 } = require('uuid');


// If only search is provided → Skip the 30-day check and date range.

// If only from and to are provided → Apply date range, skip search.

// If both are missing → Default to 30-day eligibility.

// For testing, you can set thirtyDaysAgo to new Date() to simulate 0-day restriction (i.e., today only).



const getEligibleSubOrders = async (req, res) => {
    const vendorId = req.vendorId;
    const { from, to, search } = req.query;
    const testZeroDays = true;

    try {
        const thirtyDaysAgo = testZeroDays === 'true'
            ? new Date()
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Build date filter
        let dateFilter = {};
        if (!search) {
            if (from && to) {
                dateFilter = {
                    deliveredAt: { $gte: new Date(from), $lte: new Date(to) }
                };
            } else {
                dateFilter = { deliveredAt: { $lte: thirtyDaysAgo } };
            }
        }

        // Fetch all orders with at least one matching subOrder
        const orders = await OrderModel.find({
            'subOrders.vendorId': vendorId,
            'subOrders.isVendorPaid': false,
            'subOrders.status': 'Delivered',
            ...(Object.keys(dateFilter).length > 0 && {
                'subOrders.deliveredAt': dateFilter.deliveredAt
            })
        });

        // Extract matching subOrders manually
        const eligibleSubOrders = [];

        for (const order of orders) {
            for (const subOrder of order.subOrders) {
                const matches =
                    subOrder.vendorId.toString() === vendorId &&
                    subOrder.isVendorPaid === false &&
                    subOrder.status === 'Delivered' &&
                    (
                        search
                            ? subOrder._id.toString() === search
                            : (!from && !to && subOrder.deliveredAt <= thirtyDaysAgo) ||
                            (from && to && subOrder.deliveredAt >= new Date(from) && subOrder.deliveredAt <= new Date(to))
                    );

                if (matches) {
                    eligibleSubOrders.push({
                        ...subOrder.toObject(),
                        orderId: order._id,
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            subOrders: eligibleSubOrders,
        });
    } catch (error) {
        console.error("Error retrieving eligible subOrders:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};




// const getEligibleSubOrders = async (req, res) => {
//     const vendorId = req.vendorId;
//     const { from, to, search } = req.query;
//     const testZeroDays = true;
//     console.log("req.query-", req.query);
//     try {
//         // 30-day threshold or immediate (0 days) if test flag is used
//         const thirtyDaysAgo = testZeroDays === 'true' ? new Date() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//         console.log("thirtyDaysAgo-", thirtyDaysAgo);
//         const matchConditions = {
//             'subOrders.vendorId': vendorId,
//             'subOrders.isVendorPaid': false,
//             'subOrders.status': 'Delivered',
//         };

//         // If search is present, match by subOrder._id and skip date conditions
//         if (search) {
//             matchConditions['subOrders._id'] = search;
//         } else if (from && to) {
//             // Date range takes priority when no search
//             matchConditions['subOrders.deliveredAt'] = {
//                 $gte: new Date(from),
//                 $lte: new Date(to),
//             };
//         } else {
//             // Default 30-day filter
//             matchConditions['subOrders.deliveredAt'] = { $lte: thirtyDaysAgo };
//         }

//         const orders = await OrderModel.aggregate([
//             { $unwind: '$subOrders' },
//             { $match: matchConditions },
//             {
//                 $project: {
//                     _id: 0,
//                     subOrder: '$subOrders',
//                     orderId: '$_id',
//                 },
//             },
//         ]);
//         console.log("orders-",orders);

//         const formatted = orders.map((entry) => ({
//             ...entry.subOrder,
//             orderId: entry.orderId,
//         }));

//         console.log("formatted-",formatted);

//         return res.status(200).json({
//             success: true,
//             subOrders: formatted,
//         });
//     } catch (error) {
//         console.error("Error retrieving eligible Vendor Orders:", error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// };



//Vendor fills a Payout Request, which Admin needs to verify and take action
const requestVendorPayout = async (req, res) => {
    const { vendorId, amount, orderId, subOrderId, payoutMethod, notes } = req.body;
    console.log("req.body-", req.body);
    try {
        const vendor = await VendorModel.findById(vendorId);
        console.log("vendor-", vendor);

        if (vendor.availableBalance < amount) {
            throw new Error('Insufficient balance');
        }

        const order = await OrderModel.findOne({
            _id: orderId
        });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const subOrder = order.subOrders.find(sub => sub._id.toString() === subOrderId);
        if (!subOrder) {
            return res.status(404).json({ message: 'SubOrder not found.' });
        }

        
        if (subOrder.isVendorPaid) {
            return res.status(400).json({ message: 'SubOrder is already marked as paid. Cannot submit Payout' });
        }
        const payoutRequest = new PayoutModel({
            vendorId,
            amount,
            orderId,
            subOrderId,
            payoutMethod,
            // transactionReference: transactionRef,
            notes,
            requestedByVendor: true,

        });

        await payoutRequest.save();
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center;">
          <h2 style="color: #4CAF50;">Payout Request for Suborder ${subOrderId}!</h2>
          <p style="font-size: 16px;">Request Payment Processing of SubOrder ${subOrderId} of Order ${orderId}, towards a
          sum of ${amount}. The payout request has been made by the vendor, ${vendor.name} on ${new Date()}.
          
          </p>
          </div>
          `;
          const adminData = await CustomerModel.findOne({ role: "admin", isDeleted: false, isActive: true }).select('_id name email');
          console.log("adminData.name-",adminData.name);
          console.log("adminData.email-",adminData.email);  

        if (payoutRequest && adminData) {

            await sendEmail({
                to: adminData.email,
                subject: `Please Pay for SubOrder ${subOrderId} of Order ${orderId} `,
                html,
            });

            await Notification.create({
                userId: adminData._id,
                //new mongoose.Types.ObjectId("6812bb3dc7fcb84788863b25"),
                userType: "customers",
                type: `Payout Request`,
                message: `Payout request for SubOrder ${subOrderId}, submitted on ${new Date()} by ${vendor.name}.`,
            });

        }

        res.status(201).json({ success: true, message: 'Payout request submitted', payoutRequest });
    } catch (error) {
        console.log("Payout Request Failed-", error);
        res.status(error.status || 500).json({ error: error.message || "Payout Request Failed" });
    }
};

// Fetches all Pending Vendor Payout Request in Admin Page

const getAllVendorPayoutRequests = async (req, res) => {
    try {
        const payouts = await PayoutModel.find({ status: 'Pending' }).populate('vendorId', 'name');
        res.json({ payoutRequests: payouts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payout requests.' });
    }
};

// Admin takes action and  updates payout status
const processVendorPayout = async (req, res) => {
    const { payoutId } = req.params;
    const { status } = req.body; // 'Approved' or 'Paid'

    try {
        console.log("payoutId-", payoutId);
        console.log("status-", status);
        const payout = await PayoutModel.findById(payoutId);
        if (!payout) return res.status(404).json({ message: 'Payout not found' });

        if (!['Approved', 'Rejected', 'Paid'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status update' });
        }

        const order = await OrderModel.findById(payout.orderId);
        if (!order) return res.status(404).json({ message: 'Associated order not found' });


        const subOrder = order.subOrders.id(payout.subOrderId);
        if (!subOrder) return res.status(404).json({ message: 'SubOrder not found' });

        if (subOrder.isVendorPaid) {
            return res.status(400).json({ message: 'SubOrder is already marked as paid' });
        }

        // Update vendor balance
        const vendor = await VendorModel.findById(payout.vendorId);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        if (vendor.availableBalance < payout.amount) {
            return res.status(400).json({ message: 'Vendor has insufficient balance' });
        }

        // Update payout status
        payout.status = status;
        //create Transaction reference No
        payout.transactionReference = `TXN-${Date.now()}-${uuidv4()}`;

        // Update subOrder
        subOrder.isVendorPaid = true;

        // Deduct vendor balance
        vendor.availableBalance -= payout.amount;


        await vendor.save();
        await order.save();
        await payout.save();
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center;">
          <h2 style="color: #4CAF50;">Payout Request Approved for Suborder ${payout.subOrderId}!</h2>
          <br/> Dear ${vendor.name}, <br/>
          <p style="font-size: 16px;">Payout Processing of SubOrder ${payout.subOrderId} of Order ${payout.orderId}, towards a
          sum of ${payout.amount} has been approved. The requested amount has been sent through the chosen Payout Method of ${payout.payoutMethod}.
          </p>
          </div>
          `;
        if (payout.status === 'Approved') {
            await sendEmail({
                to: vendor.email,
                subject: `Payout Approved by Admin for SubOrder ${payout.subOrderId} of Order ${payout.orderId} `,
                html,
            });

            await Notification.create({
                userId: payout.vendorId,
                userType: "vendors",
                type: `Payout Request Approved`,
                message: `Payout request approved for SubOrder ${payout.subOrderId}, submitted on ${new Date()}.`,
            });
        }

        res.status(200).json({ message: 'Payout approved and processed', payout });
    } catch (error) {
        console.error('Approve Payout Failed -', error);
        res.status(500).json({ error: error.message || 'Payout approval failed' });
    }

};


module.exports = { requestVendorPayout, processVendorPayout, getEligibleSubOrders, getAllVendorPayoutRequests };
