const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
    let { data: settingsArray, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1);

    let settings = settingsArray && settingsArray.length > 0 ? settingsArray[0] : null;

    if (error || !settings) {
        // If not found, insert defaults
        const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert([{}])
            .select()
            .single();

        if (insertError) {
            res.status(500);
            throw new Error('Failed to fetch settings');
        }
        settings = newSettings;
    }

    // Map snake_case to camelCase
    const mappedSettings = {
        ...settings,
        siteName: settings.site_name,
        heroTitle: settings.hero_title,
        heroSubtitle: settings.hero_subtitle,
        heroImage: settings.hero_image,
        contactEmail: settings.contact_email,
        contactPhone: settings.contact_phone,
        contactAddress: settings.contact_address,
        socialInstagram: settings.social_instagram,
        socialFacebook: settings.social_facebook,
        socialYoutube: settings.social_youtube,
        adminProfileImage: settings.admin_profile_image,
        aboutHeading: settings.about_heading,
        aboutShort: settings.about_short,
        aboutLong: settings.about_long,
        aboutImage: settings.about_image,
        storyCategories: settings.story_categories || [],
        audioCategories: settings.audio_categories || [],
        bookCategories: settings.book_categories || [],
        blogCategories: settings.blog_categories || []
    };

    res.json(mappedSettings);
});

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    // Safely get the settings row - use limit(1) instead of single() to avoid error if multiple rows exist
    let { data: settingsArray, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .limit(1);

    if (fetchError) {
        res.status(500);
        throw new Error('Failed to fetch settings');
    }

    let settings = settingsArray && settingsArray.length > 0 ? settingsArray[0] : null;

    // If no settings exist yet, create one
    if (!settings) {
        const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert([{}])
            .select()
            .single();

        if (insertError) {
            res.status(500);
            throw new Error('Failed to create settings');
        }
        settings = newSettings;
    }

    const updates = {
        site_name: req.body.siteName,
        hero_title: req.body.heroTitle,
        hero_subtitle: req.body.heroSubtitle,
        hero_image: req.body.heroImage,
        contact_email: req.body.contactEmail,
        contact_phone: req.body.contactPhone,
        contact_address: req.body.contactAddress,
        social_instagram: req.body.socialInstagram,
        social_facebook: req.body.socialFacebook,
        social_youtube: req.body.socialYoutube,
        admin_profile_image: req.body.adminProfileImage,
        about_heading: req.body.aboutHeading,
        about_short: req.body.aboutShort,
        about_long: req.body.aboutLong,
        about_image: req.body.aboutImage
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    if (req.body.storyCategories) {
        updates.story_categories = Array.isArray(req.body.storyCategories)
            ? req.body.storyCategories
            : req.body.storyCategories.split(',').map(c => c.trim());
    }

    if (req.body.audioCategories) {
        updates.audio_categories = Array.isArray(req.body.audioCategories)
            ? req.body.audioCategories
            : req.body.audioCategories.split(',').map(c => c.trim());
    }

    if (req.body.bookCategories) {
        updates.book_categories = Array.isArray(req.body.bookCategories)
            ? req.body.bookCategories
            : req.body.bookCategories.split(',').map(c => c.trim());
    }

    if (req.body.blogCategories) {
        updates.blog_categories = Array.isArray(req.body.blogCategories)
            ? req.body.blogCategories
            : req.body.blogCategories.split(',').map(c => c.trim());
    }

    const { data: updatedSettings, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

    if (error) {
        res.status(500);
        throw new Error('Update failed');
    }

    res.json(updatedSettings);
});

module.exports = {
    getSettings,
    updateSettings,
};
