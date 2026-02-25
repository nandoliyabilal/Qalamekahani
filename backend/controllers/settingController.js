const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
    // Only one row for settings
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

    if (!data && !error) {
        // Create default if not exists
        const { data: newVal } = await supabase
            .from('settings')
            .insert([{ site_name: 'QalamVerse' }])
            .select()
            .single();
        return res.json(newVal);
    }

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        res.status(500);
        throw new Error(error.message);
    }

    res.json(data || {});
});

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    // We assume ID is known or we just update the first row if we enforce single row
    // For simplicity, let's assume we pass ID or just fetch the first one.

    // First get the ID
    const { data: current } = await supabase.from('settings').select('id').limit(1).single();

    if (!current) {
        res.status(404);
        throw new Error('Settings not found');
    }

    const updates = {
        site_name: req.body.siteName,
        maintenance_mode: req.body.isMaintenanceMode,
        contact_email: req.body.contactEmail,
        // Map other fields as needed based on Schema
    };

    const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', current.id)
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    res.json(data);
});

module.exports = { getSettings, updateSettings };
