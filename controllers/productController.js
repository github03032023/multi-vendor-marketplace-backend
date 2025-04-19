const ProductModel = require("../models/productModel");
const VendorModel = require("../models/vendorModel");
const { generateProductCode } = require("../utilities/productUtilities");

const registerProduct = async (req, res) => {
    try {
        const { productName, description, price, quantity, category, vendorId, images } = req.body;

        if (!productName || !description || !price || !quantity || !category || !vendorId || !images) {
            return res.status(400).json({ error: "All fields are required." });
        }

        //check for existing similar product
        const existingProduct = await ProductModel.findOne({ productName, category, vendorId });
        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists in this category." });
        }

        // Generate productCode
        const productCode = generateProductCode(productName, category);

        const newProduct = new ProductModel({
            productCode,
            productName,
            description,
            price,
            quantity,
            category,
            vendorId,
            images
        });

        const savedProduct = await newProduct.save();

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: { id: savedProduct._id, productcode: savedProduct.productCode, productName, price, category, quantity }
        });

    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// Update Product
const updateProductByCode = async (req, res) => {
    try {
        const { productCode } = req.params;
        const { productName, description, price, quantity, category, vendorId, images } = req.body;

        if (!productCode) {
            return res.status(400).json({ error: "Product code is required." });
        }

        // Find the product by productCode
        const product = await ProductModel.findOne({ productCode });

        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        // Update fields if they are provided
        if (productName !== undefined) product.productName = productName;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (quantity !== undefined) product.quantity = quantity;
        if (category !== undefined) product.category = category;
        if (vendorId !== undefined) product.vendorId = vendorId;
        if (images !== undefined) product.images = images;

        // Save the updated product
        const updatedProduct = await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });

    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// Delete Product
const deleteProductByCode = async (req, res) => {
    try {
        const { productCode } = req.params;

        if (!productCode) {
            return res.status(400).json({ error: "Product code is required." });
        }

        const deletedProduct = await ProductModel.findOneAndDelete({ productCode });

        if (!deletedProduct) {
            return res.status(404).json({ error: "Product not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully.",
            deletedProduct
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


//Get ALL Active Products for a particular Vendor
const getActiveProductsForVendor = async (req, res) => {
    try {
        const { vendorName } = req.params;
        if (!vendorName) {
            return res.status(400).json({ error: "vendorName is required." });
        }

        // Find the VendorId using VendorNmae
        const vendorFound = await VendorModel.findOne({ name: vendorName }).lean();
        if (!vendorFound) {
            return res.status(400).json({ error: "Vendor Not Found." });
        }

        const activeProducts = await ProductModel.find({ vendorId: vendorFound._id, isActive: true });

        if (!activeProducts) {
            return res.status(404).json({ error: "No Active Product found for the Vendor." });
        }

        return res.status(200).json({
            success: true,
            products: activeProducts
        });
    } catch (error) {
        console.error("Error retrieving active products:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


//Get ALL Produvts
const getActiveProducts = async (req, res) => {
    try {
        const activeProducts = await ProductModel.find({ isActive: true });
        // .populate({
        //     path: 'vendorId',
        //     select: 'name companyDetails.companyName companyDetails.companyAddress.country'
        // });
        return res.status(200).json({
            success: true,
            products: activeProducts
        });
    } catch (error) {
        console.error("Error retrieving active products:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};





module.exports = {
    registerProduct,
    updateProductByCode,
    deleteProductByCode,
    getActiveProductsForVendor,
    getActiveProducts
};