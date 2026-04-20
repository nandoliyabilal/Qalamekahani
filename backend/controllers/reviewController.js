const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

// @desc    Get reviews for a specific item
// @route   GET /api/reviews?targetId=...&targetType=...
const getReviews = asyncHandler(async (req, res) => {
    const { targetId } = req.query;

    let query = 'SELECT * FROM reviews';
    let params = [];
    if (targetId) {
        query += ' WHERE item_id = ?';
        params.push(targetId);
    }
    query += ' ORDER BY created_at DESC';

    const [reviews] = await db.execute(query, params);

    // Format for frontend consistency
    const formattedReviews = reviews.map(review => ({
        id: review.id,
        user_id: review.user_id,
        user_name: review.user_name || 'Anonymous User',
        targetId: review.item_id,
        targetType: review.item_type,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        reply: review.reply,
        admin_reply_name: review.admin_reply_name || 'Admin',
        created_at: review.created_at
    }));

    res.status(200).json(formattedReviews);
});

// @desc    Create a review
const createReview = asyncHandler(async (req, res) => {
    const { targetId, targetType, rating, comment } = req.body;

    if (!targetId || !targetType || !rating || !comment) {
        res.status(400);
        throw new Error('Please allow all fields');
    }

    // Check if review already exists
    const [existing] = await db.execute(
        'SELECT id FROM reviews WHERE user_id = ? AND item_id = ?',
        [req.user.id, targetId]
    );

    if (existing.length > 0) {
        res.status(400);
        throw new Error('You have already reviewed this item');
    }

    // Insert review
    const userId = parseInt(req.user.id);
    const [result] = await db.execute(
        'INSERT INTO reviews (user_id, user_name, item_id, item_type, rating, comment, status) VALUES (?, ?, ?, ?, ?, ?, "approved")',
        [userId, req.user.name, String(targetId), targetType, rating, comment]
    );

    const [newRows] = await db.execute('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
    const review = newRows[0];

    res.status(201).json({
        id: review.id,
        user_name: review.user_name,
        targetId: review.item_id,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        created_at: review.created_at
    });
});

// @desc    Update review status (Admin)
const updateReviewStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reply, adminName } = req.body;

    const updates = [];
    const values = [];

    if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
    }
    if (reply !== undefined) {
        updates.push('reply = ?');
        values.push(reply);
        updates.push('admin_reply_name = ?');
        values.push(adminName || 'Admin');
    }

    if (updates.length === 0) {
        res.status(400);
        throw new Error('No update data provided');
    }

    values.push(id);
    await db.execute(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await db.execute('SELECT * FROM reviews WHERE id = ?', [id]);
    const review = rows[0];

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    res.status(200).json(review);
});

// @desc    Delete review (Admin)
const deleteReview = asyncHandler(async (req, res) => {
    await db.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getReviews,
    createReview,
    updateReviewStatus,
    deleteReview
};
