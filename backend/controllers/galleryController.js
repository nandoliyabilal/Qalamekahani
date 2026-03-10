const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');
const { sendEmailNotification } = require('../utils/notificationHelper');

// @desc    Get all images
// @route   GET /api/gallery
// @access  Public
const getImages = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }
    res.status(200).json(data);
});

// @desc    Increment Download/Save Count
// @route   POST /api/gallery/:id/download
// @access  Public
const downloadImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // First get current
    const { data: img, error: fetchErr } = await supabase
        .from('galleries')
        .select('downloads')
        .eq('id', id)
        .single();
        
    if (fetchErr) return res.status(404).json({ message: 'Image not found' });

    const { data, error } = await supabase
        .from('galleries')
        .update({ downloads: (img.downloads || 0) + 1 })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    
    res.status(200).json(data);
});

// @desc    Create new image
// @route   POST /api/gallery
// @access  Private (Admin)
const createImage = asyncHandler(async (req, res) => {
    const { title, image, category } = req.body;

    if (!title || !image) {
        res.status(400);
        throw new Error('Title and Image are required');
    }

    const { data, error } = await supabase
        .from('galleries')
        .insert([{
            title,
            image,
            category: category || 'General'
        }])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    // Pass 'gallery' as type for notification if desired
    // await sendEmailNotification(data, 'gallery');

    res.status(201).json(data);
});

// @desc    Delete Image
// @route   DELETE /api/gallery/:id
// @access  Private (Admin)
const deleteImage = asyncHandler(async (req, res) => {
    const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getImages,
    createImage,
    deleteImage,
    downloadImage
};
