const express = require('express');
const router = express.Router();
const { getBlogs, getBlog, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getBlogs)
    .post(protect, authorize('admin', 'editor'), createBlog);

router.route('/:slug').get(getBlog);

router.route('/:id')
    .put(protect, authorize('admin', 'editor'), updateBlog)
    .delete(protect, authorize('admin'), deleteBlog);

module.exports = router;
