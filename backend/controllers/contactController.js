const asyncHandler = require('express-async-handler');
const { sendEmail } = require('../utils/emailService');

// @desc    Submit Contact Form
// @route   POST /api/contact
// @access  Public
const submitContactForm = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        res.status(400);
        throw new Error('Please fill in all fields');
    }

    try {
        const adminEmail = process.env.EMAIL_USERNAME || 'sabirkhanp646@gmail.com';

        // 1. Send email to Admin (This should work as it's the verified email)
        try {
            await sendEmail({
                email: adminEmail,
                subject: `New Message from ${name} - Qalamekahani`,
                type: 'contact_admin',
                itemData: {
                    name,
                    userEmail: email,
                    userMessage: message
                }
            });
        } catch (adminErr) {
            console.error('Admin Notification Error:', adminErr);
            // We continue even if admin notification fails, but maybe we should throw here if we want to be strict
        }

        // 2. Send confirmation to User (This OFTEN fails in Resend Sandbox if email is not verified)
        try {
            await sendEmail({
                email: email,
                subject: 'Thank You for contacting Qalamekahani!',
                type: 'contact_user',
                itemData: {
                    name,
                    userMessage: message
                }
            });
        } catch (userErr) {
            console.warn('User Confirmation Email Skipped/Failed (Might be Resend Sandbox limit):', userErr.message);
        }

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact Form Error:', error);
        res.status(500);
        throw new Error('Process failed');
    }
});

const supabase = require('../config/supabase'); // Ensure supabase is available

// @desc    Newsletter Subscription
// @route   POST /api/contact/subscribe
// @access  Public
const subscribeNewsletter = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    try {
        // 1. Check if already subscribed
        const { data: existing, error: checkError } = await supabase
            .from('subscribers')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ success: true, message: 'Aapne pehle hi newsletter subscribe kar rakha hai! Dhanyawad.' });
        }

        // 2. Add to database (CRITICAL STEP)
        const { error: insertError } = await supabase
            .from('subscribers')
            .insert([{ email }]);

        if (insertError) {
            console.error('Subscription Insert Error:', insertError);
            res.status(400);
            throw new Error('Already subscribed or invalid email');
        }

        const adminEmail = process.env.EMAIL_USERNAME || 'sabirkhanp646@gmail.com';

        // 3. Notify Admin (Wrap in try-catch)
        try {
            await sendEmail({
                email: adminEmail,
                subject: 'New Newsletter Subscriber - Qalamekahani',
                type: 'newsletter_admin',
                itemData: { email }
            });
        } catch (e) { console.error('Newsletter Admin Notify Fail:', e.message); }

        // 4. Send Confirmation to User (Wrap in try-catch - often fails in sandbox)
        try {
            await sendEmail({
                email: email,
                subject: 'Welcome to the Qalamekahani Newsletter!',
                type: 'newsletter_user',
                itemData: { email }
            });
        } catch (e) { console.warn('Newsletter User Confirm Fail (Sandbox?):', e.message); }

        res.status(200).json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
        console.error('Subscription Fatal Error:', error);
        if (res.statusCode === 400) throw error;
        res.status(500);
        throw new Error('Subscription process completed with some alert');
    }
});

module.exports = {
    submitContactForm,
    subscribeNewsletter
};
