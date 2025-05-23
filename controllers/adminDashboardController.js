// import mongoose from 'mongoose';
const mongoose = require("mongoose");
const Order = require('../models/orderModel');
const Notification = require('../models/notificationModel');
const Payment = require('../models/paymentModel');
const Vendor = require('../models/vendorModel');
const VendorPayout = require('../models/vendorPayoutModel');

exports.getFilteredOrders = async (req, res) => {
  try {
    const { status } = req.query;

    let orders;

    if (status) {
      // Find orders with at least one subOrder matching the status
      orders = await Order.find({ 'subOrders.status': status })
        .populate('customerId')
        .populate('subOrders.vendorId')
        .populate('paymentId');
    } else {
      // Get all orders
      orders = await Order.find()
        .populate('customerId')
        .populate('subOrders.vendorId')
        .populate('paymentId');
    }

    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};


// cancel suborder in case the Admin needs to
exports.cancelSubOrder = async (req, res) => {
  try {
    const { subOrderId } = req.params;

    const order = await Order.findOne({ 'subOrders._id': subOrderId });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const subOrder = order.subOrders.id(subOrderId);
    if (!subOrder) return res.status(404).json({ message: 'SubOrder not found' });

    if (['Delivered', 'Cancelled'].includes(subOrder.status)) {
      return res.status(400).json({ message: 'Cannot cancel this subOrder' });
    }


    // Determine updatedByModel
    let updatedByModel = 'customers';


    subOrder.status = 'Cancelled';
    subOrder.statusHistory.push({
      status: 'Cancelled',
      updatedBy: req.userId || null,
      updatedAt: new Date(),
      updatedByModel,
    });

    // Optionally update overallStatus if needed (e.g. all cancelled => overall Cancelled)
    const allStatuses = order.subOrders.map(so => so.status);
    if (allStatuses.every(st => st === 'Cancelled')) {
      order.overallStatus = 'Cancelled';
      order.overallStatusHistory.push({
        status: 'Cancelled',
        updatedBy: req.userId || null,
        updatedAt: new Date(),
        updatedByModel,
      });
    }

    await order.save();
    if (order) {
      // Create a notification for the customer
      await Notification.create({
        userId: subOrder.customerId,
        userType: "customers",
        type: 'Admin CancelOrder',
        message: `Your SubOrder ${subOrderId} of Order ${order._id}, has been cancelled by Admin on ${subOrder.statusHistory.updatedAt}`,
        customerId: returnRequest.customerId
      });
    }
    res.json({ message: 'SubOrder cancelled successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error cancelling subOrder' });
  }
};


//Get Count of SubOrders by Status
exports.getOrderStatusStats = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: '$subOrders' },
      {
        $group: {
          _id: '$subOrders.status',
          count: { $sum: 1 },
        },
      },
    ];

    const statsRaw = await Order.aggregate(pipeline);

    const stats = statsRaw.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting order stats' });
  }
};


exports.getOrdersById = async (req, res) => {
  try {
    const { OrderId } = req.params;

    const order = await Order.findById(OrderId)
      .populate('customerId paymentId subOrders.vendorId subOrders.products.productId')
      .populate('overallStatusHistory.updatedBy', 'name') // only fetch name
      .populate('subOrders.statusHistory.updatedBy', 'name'); // if needed for suborders

    if (!order) return res.status(404).json({ error: 'Order not found' });
    console.log("order-", order);
    // Manually populate each subOrder.statusHistory.updatedBy
      for (const subOrder of order.subOrders) {
        await Promise.all(
          subOrder.statusHistory.map(async (entry, index) => {
            if (entry.updatedBy && entry.updatedByModel) {
              const Model = entry.updatedByModel === 'vendors'
                ? require('../models/vendorModel')
                : require('../models/customerModel');
              const user = await Model.findById(entry.updatedBy).select('name');
              subOrder.statusHistory[index].updatedBy = user;
            }
          })
        );
    }
    console.log(" after order-", order);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.searchOrders = async (req, res) => {
  try {
    const {
      vendorName,
      customerName,
      mainOrderId,
      subOrderId,
      orderStatus,
      subOrderStatus,
      startDate,
      endDate,
      page = 1,
      pageSize = 10
    } = req.body;

    const matchStage = {};

    if (mainOrderId && mongoose.Types.ObjectId.isValid(mainOrderId)) {
      matchStage._id = new mongoose.Types.ObjectId(mainOrderId);
    }

    if (orderStatus) {
      matchStage.overallStatus = orderStatus;
    }

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customerId'
        }
      },
      { $unwind: '$customerId' },
      {
        $lookup: {
          from: 'vendors',
          localField: 'subOrders.vendorId',
          foreignField: '_id',
          as: 'vendorDocs'
        }
      },
      {
        $addFields: {
          subOrders: {
            $map: {
              input: '$subOrders',
              as: 'sub',
              in: {
                $mergeObjects: [
                  '$$sub',
                  {
                    vendorName: {
                      $let: {
                        vars: {
                          matchedVendor: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$vendorDocs',
                                  cond: { $eq: ['$$this._id', '$$sub.vendorId'] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: '$$matchedVendor.name'
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ];

    // Additional client-side filters (after enrichment)
    if (customerName) {
      pipeline.push({
        $match: { 'customerId.name': { $regex: customerName, $options: 'i' } }
      });
    }

    if (vendorName) {
      pipeline.push({
        $match: { 'subOrders.vendorName': { $regex: vendorName, $options: 'i' } }
      });
    }

    if (subOrderStatus) {
      pipeline.push({
        $match: { 'subOrders.status': subOrderStatus }
      });
    }

    if (subOrderId && mongoose.Types.ObjectId.isValid(subOrderId)) {
      pipeline.push({
        $match: { 'subOrders._id': new mongoose.Types.ObjectId(subOrderId) }
      });
    }

    // Clone for counting total
    const countPipeline = [...pipeline, { $count: 'total' }];

    // Pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize }
    );

    const [orders, countResult] = await Promise.all([
      Order.aggregate(pipeline),
      Order.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    res.json({
      orders,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.adminAnalytics = async (req, res) => {

  try {
    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      payments,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      topPaymentMethods,
      failedOrPendingRefunds,
      topEarningVendors,
      pendingVendorPayouts,
      vendorsWithMostOrders,
      vendorApprovalRate,
      inactiveVendors
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ overallStatus: 'Completed' }),
      Order.countDocuments({ overallStatus: 'Cancelled' }),
      Payment.aggregate([
        { $match: { paymentStatus: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.aggregate([ { $match: { overallStatus: 'Completed', createdAt: { $gte: new Date(Date.now() - 86400000) } }, $group: { _id: null, total: { $sum: '$totalAmount' } } } ]),
      Order.aggregate([ { $match: { overallStatus: 'Completed', createdAt: { $gte: new Date(Date.now() - 604800000) } }, $group: { _id: null, total: { $sum: '$totalAmount' } } } ]),
      Order.aggregate([ { $match: { overallStatus: 'Completed', createdAt: { $gte: new Date(Date.now() - 2628000000) } }, $group: { _id: null, total: { $sum: '$totalAmount' } } } ]),
      Payment.aggregate([ { $group: { _id: '$paymentMethod', count: { $sum: 1 } } } ]),
      Payment.aggregate([ { $match: { paymentStatus: { $in: ['Failed', 'RefundPending'] } }, $group: { _id: null, total: { $sum: '$amount' } } } ]),
      Vendor.find().sort({ totalEarned: -1 }).limit(5),
      VendorPayout.countDocuments({ status: 'Pending' }),
      Order.aggregate([ { $unwind: '$subOrders' }, { $group: { _id: '$subOrders.vendorId', orderCount: { $sum: 1 } } }, { $sort: { orderCount: -1 } }, { $limit: 5 } ]),
      Vendor.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            approved: { $sum: { $cond: ['$isApproved', 1, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            approvalRate: { $multiply: [{ $divide: ['$approved', '$total'] }, 100] }
          }
        }
      ]),
      Vendor.find({ $or: [{ isActive: false }, { lastOrderDate: { $lt: new Date(Date.now() - 2628000000) } }] })
    ]);

    res.json({
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalPaymentsCollected: payments[0]?.total || 0,
      dailyRevenue: dailyRevenue[0]?.total || 0,
      weeklyRevenue: weeklyRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      topPaymentMethods,
      failedOrPendingRefunds: failedOrPendingRefunds[0]?.total || 0,
      topEarningVendors,
      pendingVendorPayouts,
      vendorsWithMostOrders,
      approvalRate: vendorApprovalRate[0]?.approvalRate.toFixed(2) || 0,
      inactiveVendors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};