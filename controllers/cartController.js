const CustomerModel = require("../models/customerModel");
const ProductModel = require("../models/productModel");
const VendorModel = require("../models/vendorModel");

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

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0." });
    }

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

    if (cartItemIndex > -1) {
      const newCartQuantity = customer.cart[cartItemIndex].quantity + quantity;

      if (newCartQuantity > product.quantity) {
        return res.status(400).json({
          error: `Only ${product.quantity} units available. You already have ${customer.cart[cartItemIndex].quantity} in cart.`,
        });
      }

      customer.cart[cartItemIndex].quantity = newCartQuantity;
    } else {
      if (quantity > product.quantity) {
        return res.status(400).json({ error: `Only ${product.quantity} units available.` });
      }

      customer.cart.push({ productId: product._id, quantity });
    }

    await customer.save();

    const savedCustomer = await CustomerModel.findById(req.userId)
      .populate({
        path: "cart.productId",
        model: "products",
        select: "_id productCode productName description category vendorId price images quantity", // Fields to return from product
      });




     
      if (!savedCustomer) {
        return res.status(404).json({ error: "Customer not found." });
      }
  
      //unique vendorIds from cart products
      const vendorIds = [...new Set(savedCustomer.cart.map(item => item.productId?.vendorId?.toString()))];
  
      console.log("Vendor IDs from cart:", vendorIds);
  
      //Fetch all suborders vendor details 
      const vendors = await VendorModel.find({ _id: { $in: vendorIds } }).select("_id name email companyDetails.companyName companyDetails.companyAddress.country");
  
      //Map vendorId to vendor info 
      const vendorMap = {};
      vendors.forEach(v => {
        vendorMap[v._id.toString()] = {
          companyName: v.companyDetails.companyName,
          country: v.companyDetails.companyAddress.country
        };
      });
  
      console.log("Fetched vendors:", vendors.map(v => v._id.toString()));
      console.log("Cart Products:", customer.cart.map(i => i.productId));
      console.log("Vendor Map:", vendorMap);
  
      // cart items
      const cartItems = savedCustomer.cart.map(item => {
        const product = item.productId;
        const vendorId = product.vendorId.toString();
        const vendor = vendorMap[vendorId] || {};
  
        console.log("product",product);
        console.log("vendorId",vendorId);
        console.log("vendor",vendor);
        return {
          productId: product._id,
          productName: product.productName,
          productCode: product.productCode,
          description: product.description,
          price: product.price,
          category: product.category,
          images: product.images,
          vendorId,
          vendorCompanyName: vendor.companyName || "CompanyName",
          vendorCountry: vendor.country,
          quantity: item.quantity,
        };
      });










    // // Construct cart items with product details
    // const cartItems = savedCustomer.cart.map(item => {
    //   const product = item.productId; // Populated product object
    //   return {
    //     productId: product.productId,
    //     productName: product.productName,
    //     productCode: product.productCode,
    //     description: product.description,
    //     price: product.price,
    //     category: product.category,
    //     images: product.images?.[0]?.url || null,
    //     vendorId: product.vendorId,
    //     //   image: product.images?.[0]?.url || null,
    //     quantity: item.quantity,
    //   };
    // });



    return res.status(200).json({ message: "Product added to cart", cart: cartItems });

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
    console.log("productCode-", productCode);

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

    const savedCustomer = await CustomerModel.findById(req.userId)
      .populate({
        path: "cart.productId",
        model: "products",
        select: "productCode productName description category vendorId price images quantity", // Fields to return from product
      });

    // Construct cart items with product details
    const cartItems = savedCustomer.cart.map(item => {
      const product = item.productId; // Populated product object
      return {
        productId: product.productId,
        productName: product.productName,
        productCode: product.productCode,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images?.[0]?.url || null,
        vendorId: product.vendorId,
        //   image: product.images?.[0]?.url || null,
        quantity: item.quantity,
      };
    });



    return res.status(200).json({
      message: "Product removed from cart.",
      updatedCart: cartItems
    });

  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCartItems = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing token",
      });
    }

    const customer = await CustomerModel.findById(req.userId).populate({
      path: "cart.productId",
      model: "products",
      select: "_id productCode productName description category vendorId price images quantity",
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    //unique vendorIds from cart products
    const vendorIds = [...new Set(customer.cart.map(item => item.productId?.vendorId?.toString()))];

    console.log("Vendor IDs from cart:", vendorIds);

    //Fetch all suborders vendor details 
    const vendors = await VendorModel.find({ _id: { $in: vendorIds } }).select("_id name email companyDetails.companyName companyDetails.companyAddress.country");

    //Map vendorId to vendor info 
    const vendorMap = {};
    vendors.forEach(v => {
      vendorMap[v._id.toString()] = {
        companyName: v.companyDetails.companyName,
        country: v.companyDetails.companyAddress.country
      };
    });

    console.log("Fetched vendors:", vendors.map(v => v._id.toString()));
    console.log("Cart Products:", customer.cart.map(i => i.productId));
    console.log("Vendor Map:", vendorMap);

    // cart items
    const cartItems = customer.cart.map(item => {
      const product = item.productId;
      const vendorId = product.vendorId.toString();
      const vendor = vendorMap[vendorId] || {};

      console.log("product",product);
      console.log("vendorId",vendorId);
      console.log("vendor",vendor);
      return {
        productId: product._id,
        productName: product.productName,
        productCode: product.productCode,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images,
        vendorId,
        vendorCompanyName: vendor.companyName || "CompanyName",
        vendorCountry: vendor.country,
        quantity: item.quantity,
      };
    });

    console.log("req.userId:", req.userId);
    console.log("customer.cart:", customer.cart);
    console.log("Mapped cartItems:", cartItems);
    return res.status(200).json({
      message: "Cart retrieved successfully",
      cart: cartItems,
    });

  } catch (error) {
    console.error("Get cart items error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};






const updateQuantity = async (req, res) => {
  const userId = req.userId;
  console.log("userId-", userId);
  const { productCode, quantity } = req.body;
  console.log("Request from Frontend-", req.body);

  if (!productCode || quantity < 1) {
    return res.status(400).json({ error: 'Invalid product or quantity.' });
  }

  try {
    // Find the product
    const product = await ProductModel.findOne({ productCode });
    if (!product || product.isDeleted || !product.isActive) {
      return res.status(404).json({ error: 'Product not available.' });
    }

    // Check stock availability
    if (quantity > product.quantity) {
      return res.status(400).json({
        error: `Only ${product.quantity} units in stock for ${product.productName}.`,
      });
    }

    // Get customer cart
    const customer = await CustomerModel.findById(userId).populate('cart.productId');
    console.log("Customer-", customer);

    const cartItem = customer.cart.find(
      (item) => item.productId.equals(product._id)
    );

    if (!cartItem) {
      return res.status(404).json({ error: 'Product not in cart.' });
    }

    // Update quantity in cart
    cartItem.quantity = quantity;
    await customer.save();

    // Prepare updated cart with product details
    // const populatedCustomer = await CustomerModel.findById(userId)
    //   .populate({
    //     path: "cart.productId",
    //     model: "products",
    //     select: "productCode productName description category vendorId price images quantity", // Fields to return from product
    //   });

    const populatedCustomer = await CustomerModel.findById(userId)
      .populate({
        path: "cart.productId",
        model: "products",
        select: "productCode productName description category vendorId price images quantity",
        populate: {
          path: "vendorId",
          model: "vendors",
          select: "companyDetails.companyName companyDetails.companyAddress.country"
        }
      });


    const updatedCart = populatedCustomer.cart.map((item) => ({
      productId: item.productId._id,
      productName: item.productId.productName,
      productCode: item.productId.productCode,
      description: item.productId.description,
      price: item.productId.price,
      category: item.productId.category,
      images: item.productId.images,
      vendorId: item.productId.vendorId._id,
      vendorCompanyName: item.productId.vendorId.companyDetails?.companyName || null,
      vendorCountry: item.productId.vendorId.companyDetails?.companyAddress?.country || null,
      quantity: item.quantity,
    }));

    res.status(200).json({ message: 'Cart updated', cart: updatedCart });
  } catch (error) {
    console.error('Update quantity error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};


const clearCart = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing token",
      });
    }

    const customer = await CustomerModel.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Clear cart
    customer.cart = [];
    await customer.save();

    return res.status(200).json({
      message: "Cart cleared successfully.",
      cart: customer.cart
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addToCart,
  removeFromCart,
  getCartItems,
  updateQuantity,
  clearCart
};
