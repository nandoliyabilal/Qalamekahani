const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');
const { sendEmail } = require('../utils/emailService');

// @desc    Submit Contact Form
const submitContactForm = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        res.status(400);
        throw new Error('Please fill in all fields');
    }

    try {
        const adminEmail = process.env.EMAIL_USERNAME || 'sabirkhanp646@gmail.com';

        // 1. Send email to Admin
        try {
            await sendEmail({
                email: adminEmail,
                subject: `New Message from ${name} - Qalamekahani`,
                type: 'contact_admin',
                itemData: { name, userEmail: email, userMessage: message }
            });
        } catch (adminErr) {
            console.error('Admin Notification Error:', adminErr);
        }

        // 2. Send confirmation to User
        try {
            await sendEmail({
                email: email,
                subject: 'Thank You for contacting Qalamekahani!',
                type: 'contact_user',
                itemData: { name, userMessage: message }
            });
        } catch (userErr) {
            console.warn('User Confirmation Email Skipped/Failed:', userErr.message);
        }

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact Form Error:', error);
        res.status(500);
        throw new Error('Process failed');
    }
});

// @desc    Newsletter Subscription
const subscribeNewsletter = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    try {
        // 1. Check if already subscribed in MySQL
        const [existing] = await db.execute('SELECT id FROM subscribers WHERE email = ?', [email]);

        if (existing.length > 0) {
            return res.status(200).json({ success: true, message: 'Aapne pehle hi newsletter subscribe kar rakha hai! Dhanyawad.' });
        }

        // 2. Add to database
        await db.execute('INSERT INTO subscribers (email) VALUES (?)', [email]);

        const adminEmail = process.env.EMAIL_USERNAME || 'sabirkhanp646@gmail.com';

        // 3. Notify Admin
        try {
            await sendEmail({
                email: adminEmail,
                subject: 'New Newsletter Subscriber - Qalamekahani',
                type: 'newsletter_admin',
                itemData: { email }
            });
        } catch (e) {
            console.error('Newsletter Admin Notify Fail:', e.message);
        }

        // 4. Send Confirmation to User
        try {
            await sendEmail({
                email: email,
                subject: 'Welcome to the Qalamekahani Newsletter!',
                type: 'newsletter_user',
                itemData: { email }
            });
        } catch (e) {
            console.warn('Newsletter User Confirm Fail:', e.message);
        }

        res.status(200).json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
        console.error('Subscription Fatal Error:', error);
        res.status(500);
        throw new Error('Subscription process failed');
    }
});

module.exports = { submitContactForm, subscribeNewsletter };
