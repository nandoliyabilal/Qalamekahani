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
        blogsViews,
        galleryData,
        ordersData
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
        supabase.from('blogs').select('*'),
        supabase.from('galleries').select('downloads'),
        supabase.from('orders').select('amount').eq('status', 'paid')
    ]);

    // Sum views
    const totalViews = [
        ...(storiesViews.data || []),
        ...(audioViews.data || []),
        ...(booksViews.data || []),
        ...(blogsViews.data || [])
    ].reduce((sum, item) => sum + (parseInt(item.views) || 0), 0);

    const totalDownloads = (galleryData.data || []).reduce((sum, item) => sum + (parseInt(item.downloads) || 0), 0);
    const totalEarnings = (ordersData.data || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

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
            totalViews: totalViews,
            totalDownloads: totalDownloads,
            totalEarnings: totalEarnings
        },
        recentUsers: recentUsersData.data || []
    });
});

// @desc    Get detailed earnings by item
// @route   GET /api/admin/earnings
// @access  Private/Admin
const getEarningsDetails = asyncHandler(async (req, res) => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            amount,
            status,
            story_id,
            book_id,
            audio_id,
            book_title,
            created_at
        `)
        .eq('status', 'paid');

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }

    // Group by item
    const earningsByItem = {};

    orders.forEach(order => {
        const itemId = order.story_id || order.book_id || order.audio_id || 'unknown';
        const type = order.story_id ? 'Story' : (order.book_id ? 'Book' : (order.audio_id ? 'Audio' : 'Other'));
        
        if (!earningsByItem[itemId]) {
            earningsByItem[itemId] = {
                id: itemId,
                title: order.book_title || 'Unknown Title',
                type: type,
                totalEarned: 0,
                salesCount: 0
            };
        }
        
        earningsByItem[itemId].totalEarned += parseFloat(order.amount) || 0;
        earningsByItem[itemId].salesCount += 1;
    });

    res.json(Object.values(earningsByItem).sort((a, b) => b.totalEarned - a.totalEarned));
});

module.exports = {
    getDashboardStats,
    getEarningsDetails
};
