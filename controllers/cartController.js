const CustomerModel = require("../models/customerModel");
const ProductModel = require("../models/productModel");

// Add a product to user's cart
const addToCart = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or missing token",
            });
        }

        const userId = req.userId;
        const { productCode, quantity } = req.body;

        // Validate quantity
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: "Quantity must be greater than 0." });
        }

        // Find product by productCode
        const product = await ProductModel.findOne({ productCode });
        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        // Check if requested quantity is available
        if (product.quantity < quantity) {
            return res.status(400).json({ error: `Only ${product.quantity} units available.` });
        }

        const customer = await CustomerModel.findById(userId);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found." });
        }

        const productIdStr = product._id.toString();
        const cartItemIndex = customer.cart.findIndex(item => item.productId.toString() === productIdStr);

        if (cartItemIndex > -1) {
            // Product exists in cart, update quantity
            const newCartQuantity = customer.cart[cartItemIndex].quantity + quantity;

            // Check if total requested quantity exceeds stock
            if (newCartQuantity > product.quantity) {
                return res.status(400).json({ error: `Adding exceeds available stock. You already have ${customer.cart[cartItemIndex].quantity} in cart.` });
            }

            customer.cart[cartItemIndex].quantity = newCartQuantity;
        } else {
            // Add new product to cart
            customer.cart.push({ productId: product._id, quantity });
        }

        // Save updated customer
        await customer.save();

        // Decrease product stock
        product.quantity -= quantity;
        await product.save();

        return res.status(200).json({ message: "Product added to cart", cart: customer.cart });

    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//REMOVE FROM CART
const removeFromCart = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or missing token",
            });
        }

        const userId = req.userId;
        const { productCode } = req.body;

        // Find product by productCode
        const product = await ProductModel.findOne({ productCode });
        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        const customer = await CustomerModel.findById(userId);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found." });
        }

        const productIdStr = product._id.toString();

        const cartItemIndex = customer.cart.findIndex(item => item.productId.toString() === productIdStr);

        if (cartItemIndex === -1) {
            return res.status(400).json({ error: "Product not found in cart." });
        }

        const removedCartItem = customer.cart[cartItemIndex];
        const quantityToRestore = removedCartItem.quantity;

        // Remove item from cart
        customer.cart.splice(cartItemIndex, 1);
        await customer.save();

        // Restore product quantity in stock
        product.quantity += quantityToRestore;
        await product.save();

        return res.status(200).json({
            message: "Product removed from cart.",
            updatedCart: customer.cart
        });

    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




module.exports = {
    addToCart,
    removeFromCart
};
