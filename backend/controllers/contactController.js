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

        // 1. Send email to Admin
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

        // 2. Send confirmation to User
        await sendEmail({
            email: email,
            subject: 'Thank You for contacting Qalamekahani!',
            type: 'contact_user',
            itemData: {
                name,
                userMessage: message
            }
        });

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Email Error:', error);
        res.status(500);
        throw new Error('Email could not be sent');
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
            return res.status(200).json({ success: true, message: 'You are already subscribed to our newsletter!' });
        }

        // 2. Add to database
        const { error: insertError } = await supabase
            .from('subscribers')
            .insert([{ email }]);

        if (insertError) {
            console.error('Subscription Insert Error:', insertError);
            res.status(400);
            throw new Error('Already subscribed or invalid email');
        }

        const adminEmail = process.env.EMAIL_USERNAME || 'sabirkhanp646@gmail.com';

        // 3. Notify Admin
        await sendEmail({
            email: adminEmail,
            subject: 'New Newsletter Subscriber - Qalamekahani',
            type: 'newsletter_admin',
            itemData: { email }
        });

        // 4. Send Confirmation to User
        await sendEmail({
            email: email,
            subject: 'Welcome to the Qalamekahani Newsletter!',
            type: 'newsletter_user',
            itemData: { email }
        });

        res.status(200).json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
        console.error('Subscription Email Error:', error);
        if (res.statusCode === 400) {
            throw error;
        }
        res.status(500);
        throw new Error('Subscription failed due to server error');
    }
});

module.exports = {
    submitContactForm,
    subscribeNewsletter
};
