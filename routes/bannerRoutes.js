const express = require('express');
const router = express.Router();
const upload = require('../config/multer'); // Cloudinary multer config
const {
  uploadHomePageBanners,
  deleteBanner,
  getHomePageBanners
} = require('../controllers/homePageBannerController');

const authMiddleware  = require('../middleware/authMiddleware');

router.post('/upload', authMiddleware,upload.array('images', 10), uploadHomePageBanners);
router.delete('/delete/:id', authMiddleware, deleteBanner);
router.get('/get', getHomePageBanners);

module.exports = router;
