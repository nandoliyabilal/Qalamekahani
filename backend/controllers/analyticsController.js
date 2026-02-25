const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Get analytics dashboard data
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
    // Fetch from analytics table
    const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(30);

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }

    // Calculate totals (simple sum in JS for now or write a View in Supabase)
    const totalViews = data.reduce((acc, curr) => acc + (curr.visits || 0), 0);

    res.json({
        dailyStats: data.reverse(),
        totalViews: totalViews
    });
});

// @desc    Record a page view
// @route   POST /api/analytics/record
// @access  Public
const recordView = asyncHandler(async (req, res) => {
    const { page } = req.body;

    // Upsert logic: Increment if exists, create if not
    // Supabase doesn't have native atomic increment in 'update' without RPC
    // For simplicity, we just insert a new row or call a stored procedure.
    // Let's assume we just want to track "visits" per page.

    // Simple approach: Check if row exists for page
    const { data: existing } = await supabase
        .from('analytics')
        .select('*')
        .eq('page', page)
        .single();

    if (existing) {
        await supabase
            .from('analytics')
            .update({ visits: existing.visits + 1 })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('analytics')
            .insert([{ page, visits: 1 }]);
    }

    res.status(200).json({ success: true });
});

module.exports = { getAnalytics, recordView };
