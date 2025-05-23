const Order = require('../models/orderModel');
const ReturnRequest = require('../models/returnRequestModel');
const { differenceInDays } = require('date-fns');
const mongoose = require('mongoose');


const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const { keyword } = req.query;

        if (!keyword || !mongoose.Types.ObjectId.isValid(keyword)) {
            return res.status(400).json({ message: 'Invalid or missing Order ID' });
        }

        const order = await Order.findOne({ _id: keyword, customerId: userId })
            .populate('subOrders.vendorId', 'name')
            .populate('subOrders.products.productId', 'productName productCode')
            .exec();

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.json({ success: true, orders: [order] });
    } catch (err) {
        console.error('Error fetching order:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const requestReturn = async (req, res) => {
    try {
        const { orderId, subOrderId, reason, message } = req.body;
        const customerId = req.userId;
        if (!orderId || !subOrderId || !reason) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }


        const order = await Order.findOne({
            _id: orderId,
            customerId,
        });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const subOrder = order.subOrders.find(sub => sub._id.toString() === subOrderId);
        if (!subOrder) {
            return res.status(404).json({ message: 'SubOrder not found.' });
        }


        const status = subOrder.status;

        let isEligible = false;

        // // 1. Return allowed if status is "Paid" and not yet shipped
        // if (status === 'Paid') {
        //     isEligible = true;
        // }

        // 2. Return allowed if status is "Delivered" and delivered within 5 days
        if (status === 'Delivered') {
            const daysSinceDelivered = differenceInDays(new Date(), new Date(subOrder.deliveredAt));
            if (daysSinceDelivered <= 5) {
                isEligible = true;
            }
        }

        if (!isEligible) {
            return res.status(400).json({ message: 'This item is not eligible for return.' });
        }


        // Prevent duplicate return requests
        const existingRequest = await ReturnRequest.findOne({
            orderId,
            subOrderId,
            customerId,
        });

        if (existingRequest) {
            return res.status(409).json({ message: 'Return request already exists.' });
        }

        const returnReq = await ReturnRequest.create({
            customerId,
            orderId,
            subOrderId,
            reason,
            message,
        });

        // Determine updatedByModel
        let updatedByModel = 'customers';

        // Update sub-order status to 'Return Requested'
        subOrder.status = 'Return Requested';
        subOrder.statusHistory.push({
            status: 'Return Requested',
            updatedAt: new Date(),
            updatedBy: customerId,
            updatedByModel,
        });

        // Determine overall order status based on all sub-orders
        const allStatuses = order.subOrders.map(so => so.status);

        if (allStatuses.every(s => s === 'Return Requested')) {
            order.overallStatus = 'Return Requested';
        }
        // Add status history for overallStatus
        order.overallStatusHistory.push({
            status: order.overallStatus,
            updatedAt: new Date(),
            updatedBy: customerId,
            updatedByModel,
        });

        await order.save();

        return res.status(201).json({ success: true, returnRequest: returnReq });

    } catch (error) {
        console.error("Error processing return request:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


const fetchRequestReturnDetails = async (req, res) => {
    try {
      const { orderId, subOrderId } = req.params;
      const returnRequest = await ReturnRequest.findOne({ orderId, subOrderId })
        .populate('customerId', 'name'); // Populate customer name
      if (!returnRequest) {
        return res.status(404).json({ message: 'Return request not found' });
      }
      res.json(returnRequest);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  


module.exports = {
    getUserOrders,
    requestReturn,
    fetchRequestReturnDetails
};
