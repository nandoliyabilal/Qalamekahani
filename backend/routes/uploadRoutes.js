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

    // Return relative path
    const relativePath = `uploads/${req.file.filename}`;

    res.status(200).json({
        url: relativePath,
        filename: req.file.filename
    });
});

module.exports = router;
