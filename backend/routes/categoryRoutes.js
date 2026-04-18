const express = require('express');
const router = express.Router();
const db = require('../config/mysql_db');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const [data] = await db.execute('SELECT * FROM categories');
        res.json(data);
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.json([]);
    }
});

// Create category
router.post('/', protect, authorize('admin', 'editor'), async (req, res) => {
    const { name, slug } = req.body;

    // Simple slug gen if missing
    const finalSlug = slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    try {
        const [result] = await db.execute(
            'INSERT INTO categories (name, slug) VALUES (?, ?)',
            [name, finalSlug]
        );
        const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
