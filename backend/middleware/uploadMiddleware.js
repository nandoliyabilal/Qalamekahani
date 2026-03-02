const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const fileType = file.mimetype.split('/')[0];
        const folder = fileType === 'audio' ? 'qalamekahani/audio' : 'qalamekahani/images';

        return {
            folder: folder,
            resource_type: 'auto',
            public_id: file.fieldname + '-' + Date.now(),
            allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp3', 'wav', 'm4a', 'mpeg', 'ogg']
        };
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = upload;

