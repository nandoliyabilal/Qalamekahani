const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        // Allowed extensions
        const filetypes = /jpeg|jpg|png|gif|webp|mp3|wav|m4a|mpeg|ogg/;
        // Allowed mimetypes
        const mimetypes = /image\/jpeg|image\/png|image\/gif|image\/webp|audio\/mpeg|audio\/wav|audio\/x-m4a|audio\/mp4|audio\/ogg/;

        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = mimetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            console.error(`Upload Rejected: ${file.originalname} (${file.mimetype})`);
            cb(new Error('Error: Files only (Images/Audio)! Accepted: Images, MP3, WAV, M4A'));
        }
    }
});

module.exports = upload;
