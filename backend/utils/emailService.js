const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});
/**
 * Premium Email Template Wrapper
 */
const getPremiumTemplate = (content, previewText = '') => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Qalamekahani</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Poppins:wght@300;400;600&display=swap');
            
            body { 
                margin: 0; 
                padding: 0; 
                background-color: #000000; 
                font-family: 'Poppins', sans-serif;
                -webkit-font-smoothing: antialiased;
            }
            .wrapper {
                width: 100%;
                table-layout: fixed;
                background-color: #000000;
                padding-bottom: 40px;
            }
            .content {
                max-width: 600px;
                margin: 0 auto;
                background-color: #0a0a0a;
                border: 1px solid #d4af37;
                border-top: 4px solid #d4af37;
                overflow: hidden;
            }
            .header {
                padding: 40px 20px;
                text-align: center;
                background: linear-gradient(to bottom, #111, #000);
            }
            .logo {
                font-family: 'Playfair Display', serif;
                font-size: 32px;
                color: #d4af37;
                text-transform: uppercase;
                letter-spacing: 4px;
                margin: 0;
            }
            .tagline {
                color: #888;
                font-size: 12px;
                letter-spacing: 2px;
                margin-top: 5px;
            }
            .body-content {
                padding: 40px;
                color: #e0e0e0;
                line-height: 1.8;
                text-align: center;
            }
            .title {
                font-family: 'Playfair Display', serif;
                font-size: 28px;
                color: #ffffff;
                margin-bottom: 20px;
            }
            .otp-box {
                display: inline-block;
                padding: 20px 35px;
                background: #111111;
                border: 1px solid #d4af37;
                color: #d4af37;
                font-size: 42px;
                font-weight: 800;
                letter-spacing: 10px;
                border-radius: 6px;
                font-family: 'Courier New', Courier, monospace;
            }
            .btn {
                display: inline-block;
                padding: 15px 40px;
                background-color: #d4af37;
                color: #000000 !important;
                text-decoration: none;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 2px;
                border-radius: 2px;
                font-size: 14px;
            }
            .footer {
                padding: 30px;
                background-color: #000;
                text-align: center;
                color: #666;
                font-size: 11px;
                border-top: 1px solid #1a1a1a;
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="content">
                <div class="header">
                    <h1 class="logo">Qalamekahani</h1>
                    <div class="tagline">Where Stories Come to Life</div>
                </div>
                <div class="body-content">${content}</div>
                <div class="footer">
                    <p>&copy; 2026 Qalamekahani. All Rights Reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
};

/**
 * Master Email Sender Utility using Resend API
 */
const sendEmail = async ({ email, subject, message, type, itemData }) => {
    let finalHtml = '';

    if (type === 'otp') {
        const content = `
            <div style="text-transform: uppercase; color: #d4af37; font-size: 13px; letter-spacing: 4px; font-weight: 600; margin-bottom: 25px;">Identity Verification</div>
            <div class="title">Security Code</div>
            <div class="message" style="color: #ccc; margin-bottom: 30px;">To complete your session, please use the following one-time password (OTP).</div>
            <div class="otp-box">${message}</div>
            <div style="margin-top: 40px; color: #777; font-size: 13px;">This code is valid for 15 minutes.</div>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'welcome') {
        const content = `
            <div class="title">Welcome to Qalamekahani!</div>
            <div class="message">Hi ${itemData.name}, we're thrilled to have you join our community of readers and storytellers.</div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" class="btn">Start Your Journey</a>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'newsletter_admin') {
        const content = `
            <div class="title">New Subscriber!</div>
            <div class="message">A new user has just subscribed to the Qalamekahani newsletter.</div>
            <div style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid #333; margin: 20px 0;">
                <p style="color: #d4af37; margin: 0; font-size: 18px;"><strong>${itemData.email}</strong></p>
                <p style="color: #666; font-size: 12px; margin-top: 10px;">Date: ${new Date().toLocaleString()}</p>
            </div>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'newsletter_user') {
        const content = `
            <div class="title">Subscription Confirmed!</div>
            <div class="message">Thank you for joining our newsletter. You are now part of our exclusive inner circle.</div>
            <div class="message" style="color: #ccc;">We'll keep you updated with the latest stories, audio series, and special releases from Sabirkhan Pathan.</div>
            <div style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" class="btn">Explore Stories</a>
            </div>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'contact_admin') {
        const content = `
            <div class="title">New Inquiry Received</div>
            <div style="text-align: left; background: #111; padding: 25px; border-radius: 10px; border: 1px solid #333;">
                <p style="margin-bottom: 10px;"><strong style="color: #d4af37;">From:</strong> ${itemData.name}</p>
                <p style="margin-bottom: 10px;"><strong style="color: #d4af37;">Email:</strong> ${itemData.userEmail}</p>
                <p style="margin-bottom: 10px;"><strong style="color: #d4af37;">Message:</strong></p>
                <p style="color: #ccc; line-height: 1.6; background: #000; padding: 15px; border-radius: 5px;">${itemData.userMessage}</p>
            </div>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'contact_user') {
        const content = `
            <div class="title">Message Received</div>
            <div class="message">Hi ${itemData.name}, thank you for reaching out to us. We have received your inquiry.</div>
            <div class="message" style="color: #ccc;">Our team (or Sabirkhan himself) will review your message and get back to you as soon as possible.</div>
            <div style="text-align: left; background: #111; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 3px solid #d4af37;">
                <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Your Message Summary:</p>
                <p style="color: #aaa; font-style: italic;">"${itemData.userMessage}"</p>
            </div>
            <p style="font-size: 13px; color: #888;">Thank you for your patience.</p>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'password_reset') {
        const content = `
            <div style="text-transform: uppercase; color: #d4af37; font-size: 13px; letter-spacing: 4px; font-weight: 600; margin-bottom: 25px;">Account Recovery</div>
            <div class="title">Password Reset</div>
            <div class="message" style="color: #ccc; margin-bottom: 30px;">We received a request to reset your password. Click the button below to choose a new one.</div>
            <a href="${itemData.resetUrl}" class="btn">Reset Password</a>
            <div style="margin-top: 40px; color: #777; font-size: 12px; border-top: 1px solid #1a1a1a; padding-top: 20px;">
                If you didn't request this, you can safely ignore this email. This link will expire in 10 minutes.
            </div>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'new_item') {
        const content = `
            <div style="text-transform: uppercase; color: #d4af37; font-size: 13px; letter-spacing: 4px; font-weight: 600; margin-bottom: 25px;">New ${itemData.typeLabel} Arrival</div>
            <div class="title">${itemData.title}</div>
            ${itemData.image ? `<img src="${itemData.image}" style="width: 100%; max-width: 500px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #333;" alt="${itemData.title}">` : ''}
            <div class="message" style="color: #ccc; margin-bottom: 30px;">${itemData.summary}</div>
            <a href="${itemData.link}" class="btn">View ${itemData.typeLabel}</a>
            <div style="margin-top: 40px; color: #777; font-size: 12px; border-top: 1px solid #1a1a1a; padding-top: 20px;">
                You are receiving this because you subscribed to Qalamekahani updates.
            </div>
        `;
        finalHtml = getPremiumTemplate(content);
    } else {
        finalHtml = getPremiumTemplate(`<div class="message">${message}</div>`);
    }

    try {
        console.log(`[EMAIL DEBUG] Preparing to send ${type} email to: ${email}`);
        
        const mailOptions = {
            from: `"Qalamekahani" <${process.env.EMAIL_USERNAME}>`,
            to: email,
            subject: subject,
            html: finalHtml,
            text: message // Fallback plain text
        };

        console.log(`[EMAIL DEBUG] Transporter attempting to sendMail to ${email}...`);
        
        // Timeout protection (Increased for slow cloud connections)
        const sendPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_TIMEOUT')), 25000));
        
        const info = await Promise.race([sendPromise, timeoutPromise]);
        
        console.log('[EMAIL] Sent successfully via Nodemailer:', info.messageId);
        return info;
    } catch (err) {
        if (err.message === 'SMTP_TIMEOUT') {
            console.error('[EMAIL ERROR] SMTP Timeout - Connection might be hanging');
        } else {
            console.error('[EMAIL ERROR] Error in sendEmail:', err);
        }
        throw err;
    }
};

module.exports = { sendEmail };

