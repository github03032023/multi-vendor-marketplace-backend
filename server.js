const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDb = require("./config/db");

dotenv.config();
const app= express();


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

// Product Routes
const productRoutes= require("./routes/productRoutes");
app.use("/api/auth/product", productRoutes);

// Cart Routes
const cartRoutes= require("./routes/cartRoutes");
app.use("/api/auth/cart", cartRoutes);

app.get("/", (req,res)=>{
    res.send("Multi Vendor Market Place is running");
});

const port = process.env.PORT || 5000;
app.listen(port, ()=>console.log(`Server running on port ${port}`));
