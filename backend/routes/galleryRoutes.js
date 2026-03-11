const express = require('express');
const router = express.Router();
const { getImages, createImage, deleteImage, downloadImage } = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getImages)
    .post(protect, authorize('admin'), createImage);

router.route('/:id').delete(protect, authorize('admin'), deleteImage);
router.route('/:id/download').post(downloadImage); // public access so anyone tracking downloads 

module.exports = router;
