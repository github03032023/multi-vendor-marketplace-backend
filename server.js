const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDb = require("./config/db");

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}


dotenv.config();
const app= express();

//  Make 'uploads' folder publicly accessible
app.use('/uploads', express.static(uploadsDir));


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDb();

// Customer Routes
const customerRoutes= require("./routes/customerRoutes");
app.use("/api/auth/customer", customerRoutes);

// Vendor Routes
const vendorRoutes= require("./routes/vendorRoutes");
app.use("/api/auth/vendor", vendorRoutes);

// Admin Routes
const adminRoutes= require("./routes/adminRoutes");
app.use("/api/auth/admin", adminRoutes);


// AdminDashboard  Routes
const adminDashboardRoutes= require("./routes/adminDashboardRoutes");
app.use("/api/auth/adminDashboard", adminDashboardRoutes);

// Product Routes
const productRoutes= require("./routes/productRoutes");
app.use("/api/auth/product", productRoutes);

// Cart Routes
const cartRoutes= require("./routes/cartRoutes");
app.use("/api/auth/cart", cartRoutes);

// Order Routes
const orderRoutes= require("./routes/orderRoutes");
app.use("/api/auth/order", orderRoutes);


// Payment Routes
const paymentRoutes= require("./routes/paymentRoutes");
app.use("/api/auth/payment", paymentRoutes);


const vendorDashboardRoutes = require("./routes/vendorDashBoardRoutes");
app.use("/api/auth/vendorDashboard", vendorDashboardRoutes);

const homePageSectionRoutes = require("./routes/homePageSectionRoutes");
app.use("/api/auth/homePageSection", homePageSectionRoutes);

const bannerRoutes = require("./routes/bannerRoutes");
app.use("/api/auth/banner", bannerRoutes);


const returnRequestRoutes = require("./routes/returnRequestRoutes");
app.use("/api/auth/returnRequest", returnRequestRoutes);

const wishlistRoutes = require("./routes/wishlistRoutes");
app.use("/api/auth/wishlist", wishlistRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/auth/notifications", notificationRoutes);


// Product Review Routes
const productReviewRoutes= require("./routes/productReviewRoutes");
app.use("/api/auth/productReview", productReviewRoutes);

const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/auth/analytics", analyticsRoutes);

// Payout Routes
const payoutRoutes= require("./routes/payoutRoutes");
app.use("/api/auth/payout", payoutRoutes);


// Platform Commission Routes
const commisssionRoutes= require("./routes/adminCommissionFormRoutes");
app.use("/api/auth/commission", commisssionRoutes);

app.get("/", (req,res)=>{
    res.send("Multi Vendor Market Place is running");
});

const port = process.env.PORT || 5000;
app.listen(port, ()=>console.log(`Server running on port ${port}`));
