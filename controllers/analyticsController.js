const OrderModel = require('../models/orderModel');
const ProductModel = require('../models/productModel');

// Get revenue data aggregated by date
const getRevenueData = async (req, res) => {
  try {
    const revenueData = await OrderModel.aggregate([
      { $group: { _id: "$date", revenue: { $sum: "$totalAmount" } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(revenueData);
  } catch (error) {
    console.error('Revenue data fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
};


// Get order data aggregated by date
const getOrdersData = async (req, res) => {
  try {
    const ordersData = await OrderModel.aggregate([
      { $group: { _id: "$date", orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(ordersData);
  } catch (error) {
    console.error('Orders data fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch orders data' });
  }
};


// Get top 5 performing products based on sales count
const getProductPerformanceData = async (req, res) => {
    try {
      const productData = await ProductModel.aggregate([
        { $group: { _id: "$name", sales: { $sum: "$salesCount" } } },
        { $sort: { sales: -1 } },
        { $limit: 5 }, // Top 5 products
      ]);
      res.json(productData);
    } catch (error) {
      console.error('Product performance data fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch product performance data' });
    }
  };

module.exports = {
  getRevenueData,
  getOrdersData,
  getProductPerformanceData
};
