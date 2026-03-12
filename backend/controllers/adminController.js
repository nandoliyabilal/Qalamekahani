const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Helper to fetch count
    const fetchCount = async (table, filter = null) => {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        if (filter) {
            Object.keys(filter).forEach(key => {
                if (key.includes('_gte')) {
                    query = query.gte(key.replace('_gte', ''), filter[key]);
                } else {
                    query = query.eq(key, filter[key]);
                }
            });
        }
        const { count, error } = await query;
        return error ? 0 : count;
    };

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [
        usersTotal,
        usersActive,
        reviewsTotal,
        storiesTotal,
        audioTotal,
        booksTotal,
        blogsTotal,
        recentUsersData,
        storiesViews,
        audioViews,
        booksViews,
        blogsViews
    ] = await Promise.all([
        fetchCount('users'),
        fetchCount('users', { last_login_gte: yesterday.toISOString() }),
        fetchCount('reviews'),
        fetchCount('stories'),
        fetchCount('audio_stories'),
        fetchCount('books'),
        fetchCount('blogs'),
        supabase.from('users').select('id, name, email, created_at, is_verified, role').order('created_at', { ascending: false }).limit(5),
        supabase.from('stories').select('views'),
        supabase.from('audio_stories').select('views'),
        supabase.from('books').select('views'),
        supabase.from('blogs').select('*') // Changed from 'views' to '*' to avoid potential error if views column is missing
    ]);

    // Sum views
    const totalViews = [
        ...(storiesViews.data || []),
        ...(audioViews.data || []),
        ...(booksViews.data || []),
        ...(blogsViews.data || [])
    ].reduce((sum, item) => sum + (parseInt(item.views) || 0), 0);

    res.json({
        users: {
            total: usersTotal,
            active: usersActive
        },
        content: {
            stories: storiesTotal,
            audio: audioTotal,
            books: booksTotal,
            blogs: blogsTotal,
            reviews: reviewsTotal,
            totalViews: totalViews
        },
        recentUsers: recentUsersData.data || []
    });
});

module.exports = {
    getDashboardStats
};
