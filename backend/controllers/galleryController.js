const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

// @desc    Get all images
const getImages = asyncHandler(async (req, res) => {
    const [data] = await db.execute('SELECT * FROM gallery ORDER BY created_at DESC');
    res.status(200).json(data);
});

// @desc    Increment Download/Save Count
const downloadImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await db.execute('UPDATE gallery SET downloads = downloads + 1 WHERE id = ?', [id]);
    const [rows] = await db.execute('SELECT * FROM gallery WHERE id = ?', [id]);
    
    if (rows.length === 0) return res.status(404).json({ message: 'Image not found' });
    
    res.status(200).json(rows[0]);
});

// @desc    Create new image
const createImage = asyncHandler(async (req, res) => {
    const { title, image, category } = req.body;

    if (!title || !image) {
        res.status(400);
        throw new Error('Title and Image are required');
    }

    const [result] = await db.execute(
        'INSERT INTO gallery (title, image, category) VALUES (?, ?, ?)',
        [title, image, category || 'General']
    );

    const [newRows] = await db.execute('SELECT * FROM gallery WHERE id = ?', [result.insertId]);
    res.status(201).json(newRows[0]);
});

// @desc    Delete Image
const deleteImage = asyncHandler(async (req, res) => {
    await db.execute('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getImages,
    createImage,
    deleteImage,
    downloadImage
};
