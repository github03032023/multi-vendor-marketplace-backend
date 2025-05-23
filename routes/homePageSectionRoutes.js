const express = require('express');
const upload = require('../config/multer');
const {
    createHomePageSection,
    getAllHomePageSections,
    deleteHomePageSection,
    uploadHomePageBanners,
    getHomePageBanners
} = require('../controllers/homePageSectionController');

const router = express.Router();

const authMiddleware  = require('../middleware/authMiddleware');


// Create homepage section for the website  by the Admin
router.post('/createHomePageSection',authMiddleware, upload.array('images', 10), createHomePageSection );
router.get('/getAllHomePageSections', getAllHomePageSections );
router.delete('/deleteHomePageSection/:id', authMiddleware,deleteHomePageSection);


module.exports = router;