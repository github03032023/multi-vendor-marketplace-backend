const Wishlist = require('../models/wishlistModel');


const addProductsToWishlist = async (req, res) => {
    const { productId } = req.body;
    console.log("productId-", productId);
    const customerId = req.userId;
    console.log("customerId-", customerId);
  
    try {
      const existing = await Wishlist.findOne({ customerId, productId });
      console.log("existing-", existing);
      if (existing) return res.status(400).json({ message: 'Already in wishlist' });
  
      const wishlistItem = new Wishlist({ customerId, productId });
      await wishlistItem.save();
      res.status(201).json({ message: 'Added to wishlist' });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
    }
};

// Get Wishlist Items
const getWishlist = async (req, res) => {
    const customerId = req.userId;
    const items = await Wishlist.find({ customerId }).populate('productId');
    res.json(items);
  };

  // DELETE Wishlist
  const deleteWishlist = async (req, res) => {
    await Wishlist.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  };

module.exports = {
    addProductsToWishlist,
    getWishlist,
    deleteWishlist
};