const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Get reviews for a specific item
// @route   GET /api/reviews?targetId=...&targetType=...
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
    const { targetId } = req.query;

    let query = supabase.from('reviews').select('*');
    if (targetId) query = query.eq('item_id', targetId);

    const { data: reviews, error } = await query.order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error('Failed to fetch reviews');
    }

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
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
    const { targetId, targetType, rating, comment } = req.body;

    if (!targetId || !targetType || !rating || !comment) {
        res.status(400);
        throw new Error('Please allow all fields');
    }

    // Check if review already exists
    const { data: reviewExists } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('item_id', targetId)
        .single();

    if (reviewExists) {
        res.status(400);
        throw new Error('You have already reviewed this item');
    }

    // Insert review
    const { data: review, error } = await supabase
        .from('reviews')
        .insert([{
            user_id: req.user.id,
            user_name: req.user.name,
            item_id: targetId,
            item_type: targetType,
            rating,
            comment,
            status: 'pending' // Reviews now require admin approval by default
        }])
        .select()
        .single();

    if (error) {
        res.status(500);
        throw new Error('Failed to create review');
    }

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
// @route   PUT /api/reviews/:id
// @access  Private (Admin)
const updateReviewStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {};
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.reply !== undefined) {
        updateData.reply = req.body.reply;
        updateData.admin_reply_name = req.body.adminName || 'Admin';
    }

    if (Object.keys(updateData).length === 0) {
        res.status(400);
        throw new Error('No update data provided');
    }

    const { data: review, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error('Update failed: ' + error.message);
    }

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Send Notification to user
    if (req.body.reply) {
        await supabase.from('notifications').insert([{
            user_id: review.user_id,
            message: `Admin replied to your review: "${req.body.reply.substring(0, 30)}..."`,
            is_read: false
        }]);
    }

    res.status(200).json(review);
});

// @desc    Delete review (Admin)
// @route   DELETE /api/reviews/:id
// @access  Private (Admin)
const deleteReview = asyncHandler(async (req, res) => {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        res.status(400);
        throw new Error('Failed to delete review');
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getReviews,
    createReview,
    updateReviewStatus,
    deleteReview
};
