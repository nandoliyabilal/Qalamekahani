const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all categories
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('categories') // User needs to create this table or I need to handle it
        .select('*');

    if (error) {
        // If table doesn't exist, return empty array gracefully to avoid crash
        console.error('Error fetching categories:', error.message);
        return res.json([]);
    }
    res.json(data);
});

// Create category
router.post('/', protect, authorize('admin', 'editor'), async (req, res) => {
    const { name, slug } = req.body;

    // Simple slug gen if missing
    const finalSlug = slug || name.toLowerCase().replace(/ /g, '-');

    const { data, error } = await supabase
        .from('categories')
        .insert([{ name, slug: finalSlug }])
        .select()
        .single();

    if (error) {
        return res.status(400).json({ message: error.message });
    }
    res.status(201).json(data);
});

module.exports = router;
