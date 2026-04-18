const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

// @desc    Get site settings
const getSettings = asyncHandler(async (req, res) => {
    let [rows] = await db.execute('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
    let settings = rows[0];

    if (!settings) {
        // If not found, insert defaults
        const [result] = await db.execute('INSERT INTO settings () VALUES ()');
        const [newRows] = await db.execute('SELECT * FROM settings WHERE id = ?', [result.insertId]);
        settings = newRows[0];
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
        storyCategories: typeof settings.story_categories === 'string' ? JSON.parse(settings.story_categories) : (settings.story_categories || []),
        audioCategories: typeof settings.audio_categories === 'string' ? JSON.parse(settings.audio_categories) : (settings.audio_categories || []),
        bookCategories: typeof settings.book_categories === 'string' ? JSON.parse(settings.book_categories) : (settings.book_categories || []),
        blogCategories: typeof settings.blog_categories === 'string' ? JSON.parse(settings.blog_categories) : (settings.blog_categories || [])
    };

    res.json(mappedSettings);
});

// @desc    Update site settings
const updateSettings = asyncHandler(async (req, res) => {
    let [rows] = await db.execute('SELECT id FROM settings ORDER BY id ASC LIMIT 1');
    let settingsId = rows[0]?.id;

    if (!settingsId) {
        const [result] = await db.execute('INSERT INTO settings () VALUES ()');
        settingsId = result.insertId;
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
        updates.story_categories = JSON.stringify(Array.isArray(req.body.storyCategories)
            ? req.body.storyCategories
            : req.body.storyCategories.split(',').map(c => c.trim()));
    }

    if (req.body.audioCategories) {
        updates.audio_categories = JSON.stringify(Array.isArray(req.body.audioCategories)
            ? req.body.audioCategories
            : req.body.audioCategories.split(',').map(c => c.trim()));
    }

    if (req.body.bookCategories) {
        updates.book_categories = JSON.stringify(Array.isArray(req.body.bookCategories)
            ? req.body.bookCategories
            : req.body.bookCategories.split(',').map(c => c.trim()));
    }

    if (req.body.blogCategories) {
        updates.blog_categories = JSON.stringify(Array.isArray(req.body.blogCategories)
            ? req.body.blogCategories
            : req.body.blogCategories.split(',').map(c => c.trim()));
    }

    const colString = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(settingsId);

    await db.execute(`UPDATE settings SET ${colString} WHERE id = ?`, values);

    const [updatedRows] = await db.execute('SELECT * FROM settings WHERE id = ?', [settingsId]);
    res.json(updatedRows[0]);
});

module.exports = {
    getSettings,
    updateSettings,
};
