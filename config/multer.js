const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'product-images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'svg'],
  },
});
const upload = multer({ storage });
module.exports = upload;
