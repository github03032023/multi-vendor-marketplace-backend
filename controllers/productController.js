const ProductModel = require("../models/productModel");
const VendorModel = require("../models/vendorModel");
const { generateProductCode } = require("../utilities/productUtilities");
const upload = require('../config/multer');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');  // To delete files after uploading

const registerProduct = async (req, res) => {
    try {
        const { productName, description, price, quantity, category, brand, model, color, type, suitableFor, vendorId, images } = req.body;

        console.log("req.body-", req.body);

        let parsedImages = images;
        if (typeof images === 'string') {
            try {
                parsedImages = JSON.parse(images); 
            } catch (err) {
                parsedImages = [];
            }
        }

        if (!productName || !description || !price || !quantity || !category 
            ||!brand || !model || !color|| !vendorId || !parsedImages.length) {
            return res.status(400).json({ error: "Please enter the required fields." });
        }

        // Check for existing similar product
        const existingProduct = await ProductModel.findOne({ productName, category, vendorId, brand, model, color });
        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name, brand, model already exists in this category." });
        }

        // Generate productCode
        const productCode = generateProductCode(productName, category);
        console.log("productCode-", productCode);

        const newProduct = new ProductModel({
            productCode,
            productName,
            description,
            price,
            quantity,
            category,
            brand,
            model,
            color, 
            type, 
            suitableFor,
            vendorId,
            images: parsedImages
        });

        console.log("images-", parsedImages);

        const savedProduct = await newProduct.save();

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: { id: savedProduct._id, productcode: savedProduct.productCode, productName, price, category, quantity }
        });

    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateProductByCode = async (req, res) => {
    try {
        const { productCode } = req.params;
        const {
            productName,
            description,
            price,
            quantity,
            category,
            brand,
            model,
            color,
            type,
            suitableFor,
            vendorId,
            images // images = full array sent from frontend: both retained and newly uploaded
        } = req.body;

        if (!productCode) {
            return res.status(400).json({ error: "Product code is required." });
        }

        const product = await ProductModel.findOne({ productCode });

        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        let parsedImages = images;
        if (typeof images === 'string') {
            try {
                parsedImages = JSON.parse(images);
            } catch (err) {
                return res.status(400).json({ error: "Invalid images format." });
            }
        }

        if (parsedImages && Array.isArray(parsedImages)) {
            if (parsedImages.length > 5) {
                return res.status(400).json({ error: "You can upload a maximum of 5 images." });
            }

            const existingImagePublicIds = product.images.map(img => img.publicId);
            const incomingImagePublicIds = parsedImages.map(img => img.publicId);

            // Identify images to delete (those that existed but were removed by the user)
            const imagesToDelete = existingImagePublicIds.filter(
                existingId => !incomingImagePublicIds.includes(existingId)
            );

            // Delete removed images from Cloudinary
            for (const publicId of imagesToDelete) {
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            // Update the product's image array with the current frontend-sent list
            product.images = parsedImages;
        }

        // Update other fields if provided
        if (productName !== undefined) product.productName = productName;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (quantity !== undefined) product.quantity = quantity;
        if (category !== undefined) product.category = category;
        if (brand !== undefined) product.brand = brand;
        if (model !== undefined) product.model = model;
        if (color !== undefined) product.color = color;
        if (type !== undefined) product.type = type;
        if (suitableFor !== undefined) product.suitableFor = suitableFor;
        if (vendorId !== undefined) product.vendorId = vendorId;

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
        const vendorId = req.vendorId;
        if (!productCode) {
            return res.status(400).json({ error: "Product code is required." });
        }

        // find the product
        const product = await ProductModel.findOne({ productCode,  vendorId: vendorId  });

        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        // Delete all associated images from Cloudinary, can update once reactivating by vendor
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                if (image.publicId) {
                    await cloudinary.uploader.destroy(image.publicId);
                }
            }
        }

        // const deletedProduct = await ProductModel.findOneAndDelete({ productCode });

        const deletedProduct = await ProductModel.findOneAndUpdate(
            { productCode , vendorId: vendorId},
            { isDeleted: true },
            { new: true }
          );

        if (!deletedProduct) {
            return res.status(404).json({ error: "Product not found and deletion was not possible." });
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
        const { vendorId } = req.params;
        console.log("vendorId-", vendorId);
        if (!vendorId) {
            return res.status(400).json({ error: "vendor is not available." });
        }

        // Find the VendorId using VendorNmae
        const vendorFound = await VendorModel.findOne({ _id: vendorId }).lean();
        if (!vendorFound) {
            return res.status(400).json({ error: "Vendor Not Found." });
        }

        const activeProducts = await ProductModel.find({ vendorId: vendorFound._id, isActive: true, isDeleted: false });

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


const uploadImagesToCloudinary = async (files) => {
    try {
        const imageDetails = [];
        for (let file of files) {
            const result = await cloudinary.uploader.upload(file.tempFilePath, {
                folder: 'product-images', // Optional folder in Cloudinary
            });
            imageDetails.push({
                url: result.secure_url,
                publicId: result.public_id,
            });
        }
        return imageDetails;
    } catch (error) {
        console.error('Error uploading to Cloudinary', error);
        throw new Error('Image upload failed');
    }
};

const deleteCloudinaryImage = async (req, res) => {
    const { publicIds } = req.body;
  
    if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return res.status(400).json({ error: "publicIds must be a non-empty array" });
      }
    
      try {
        const results = await Promise.all(
          publicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
        );
    
        res.status(200).json({
          message: "Images deleted from Cloudinary successfully",
          results,
        });
      } catch (error) {
        console.error("Cloudinary bulk delete error:", error);
        res.status(500).json({ error: "Failed to delete images from Cloudinary" });
      }
  };

module.exports = {
    registerProduct,
    updateProductByCode,
    deleteProductByCode,
    getActiveProductsForVendor,
    getActiveProducts,
    uploadImagesToCloudinary,
    deleteCloudinaryImage
};