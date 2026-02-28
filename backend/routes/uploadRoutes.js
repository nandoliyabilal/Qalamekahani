const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return Cloudinary Secure URL
    const fileUrl = req.file.path;

    res.status(200).json({
        url: fileUrl,
        filename: req.file.filename
    });
});

module.exports = router;
