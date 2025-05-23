const HomepageBanner = require('../models/bannerModel');
const cloudinary = require('cloudinary').v2;

const uploadHomePageBanners = async (req, res) => {
    try {
        // const { title, description, imageDescriptions } = req.body;
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: 'At least one image is required.' });
        const imageDescriptionsArr = JSON.parse(req.body.imageDescriptions || '[]');

        const uploads = req.files.map((file, index) => ({
            url: file.path,
            publicId: file.filename,
            description: imageDescriptionsArr[index] || '',
        }));

        const banner = new HomepageBanner({ images: uploads });
        await banner.save();

        res.status(201).json(banner);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed' });
    }
};

// const updateHomePageBanner = async (req, res) => {
//     try {
//         const { id } = req.params;
//         // const { title, description, imageDescriptions } = req.body;
//         const imageDescriptionsArr = JSON.parse(req.body.imageDescriptions || '[]');

//         const uploads = req.files.map((file, index) => ({
//             url: file.path,
//             publicId: file.filename,
//             description: imageDescriptionsArr[index] || '',
//         }));

//         const updated = await HomepageBanner.findByIdAndUpdate(id, {
//             images: uploads
//         }, { new: true });

//         res.json(updated);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Update failed' });
//     }
// };


const deleteBanner = async (req, res) => {
    try {
      const bannerId = req.params.id;
      console.log('banerId -',bannerId);
      const banner = await HomepageBanner.findById(bannerId);
      if (!banner) {
        return res.status(404).json({ message: 'Banner not found' });
      }
  
      // Delete each image from Cloudinary
      for (const img of banner.images) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }
  
      await HomepageBanner.findByIdAndDelete(bannerId);
      res.status(200).json({ message: 'Banner and images deleted successfully' });
    } catch (err) {
      console.error('Delete banner error:', err);
      res.status(500).json({ message: 'Server error while deleting banner' });
    }
  };

const getHomePageBanners = async (req, res) => {
    try {
        const banner = await HomepageBanner.find().sort({ _id: -1 }).limit(1);
        res.json(banner[0] || {});
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch banners.' });
    }
};

module.exports = {
    uploadHomePageBanners,
    deleteBanner,
    getHomePageBanners
};
