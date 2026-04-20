const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

// @desc    Get site settings
const getSettings = asyncHandler(async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM settings LIMIT 1');
    let settings = rows[0];

    if (!settings) {
        // Create default if not exists
        const [result] = await db.execute('INSERT INTO settings (site_name) VALUES (?)', ['Qalamekahani']);
        const [newRows] = await db.execute('SELECT * FROM settings WHERE id = ?', [result.insertId]);
        settings = newRows[0];
    }

    res.json(settings);
});

// @desc    Update site settings
const updateSettings = asyncHandler(async (req, res) => {
    const [rows] = await db.execute('SELECT id FROM settings LIMIT 1');
    const settingsId = rows[0]?.id;

    if (!settingsId) {
        res.status(404);
        throw new Error('Settings not found');
    }

    const { siteName, isMaintenanceMode, contactEmail } = req.body;
    
    // Support both snake_case and camelCase input
    const updates = {
        site_name: siteName || req.body.site_name,
        maintenance_mode: isMaintenanceMode !== undefined ? isMaintenanceMode : req.body.maintenance_mode,
        contact_email: contactEmail || req.body.contact_email
    };

    const updateFields = [];
    const values = [];
    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
            updateFields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    });

    if (updateFields.length > 0) {
        values.push(settingsId);
        await db.execute(`UPDATE settings SET ${updateFields.join(', ')} WHERE id = ?`, values);
    }

    const [updatedRows] = await db.execute('SELECT * FROM settings WHERE id = ?', [settingsId]);
    res.json(updatedRows[0]);
});

module.exports = { getSettings, updateSettings };
