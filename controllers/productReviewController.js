const Review = require('../models/productReviewModel');
const Product = require('../models/productModel');

const reviewProduct = async (req, res) => {
    const { productId, rating, comment } = req.body;
  const customerId = req.userId;
  const image = {
    url: req.file.path,
    publicId: req.file.filename,
  };

  try {
    const review = new Review({ productId, customerId, rating, comment, image });
    await review.save();
    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


const getReviewedProducts =  async (req, res) => {
    try {
        console.log("Request hit");
        const {productCode } = req.params;
        console.log("productCode-",productCode);
      const product = await Product.findOne({productCode: productCode })
        .populate('vendorId', 'name companyDetails.companyName  companyDetails.companyAddress.country');
  
      if (!product) return res.status(404).json({ message: 'Product not found' });
      console.log("Product-",product);
      console.log("Product-",product._id );

      const reviews = await Review.find({ productId: product._id })
        .populate('customerId', 'name')
        .sort({ createdAt: -1 });
        
        console.log("reviews-",reviews);
  
      res.json({ product, reviews });
    } catch (err) {
        console.error('Error in getReviewedProducts:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
  };


module.exports = {
    reviewProduct,
    getReviewedProducts
};