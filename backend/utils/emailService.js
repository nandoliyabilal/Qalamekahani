// Using Brevo REST API instead of SMTP to avoid Port-blocking on Cloud Hosting (Render/Hostinger)
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

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
    } else if (type === 'password_reset_otp') {
        const content = `
            <div style="text-transform: uppercase; color: #d4af37; font-size: 13px; letter-spacing: 4px; font-weight: 600; margin-bottom: 25px;">Account Security</div>
            <div class="title">Password Reset Code</div>
            <div class="message" style="color: #ccc; margin-bottom: 30px;">Use the following OTP to reset your password. This code will expire in 10 minutes.</div>
            <div class="otp-box">${message}</div>
            <div style="margin-top: 40px; color: #777; font-size: 13px;">If you didn't request this, please ignore this email.</div>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'security_alert') {
        const content = `
            <div style="text-transform: uppercase; color: #ff6b6b; font-size: 13px; letter-spacing: 4px; font-weight: 600; margin-bottom: 25px;">Security Alert</div>
            <div class="title">Password Changed</div>
            <div class="message" style="color: #ccc; margin-bottom: 30px;">This is to confirm that the password for your Qalamekahani account has been successfully updated.</div>
            <div style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid #333; margin: 20px 0;">
                <p style="color: #fff; margin: 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                <p style="color: #888; font-size: 12px; margin-top: 10px;">If you did not make this change, please contact us immediately to secure your account.</p>
            </div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/profile.html" class="btn">View Account</a>
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
    } else if (type === 'payment_success') {
        const content = `
            <div style="text-transform: uppercase; color: #2ecc71; font-size: 13px; letter-spacing: 4px; font-weight: 600; margin-bottom: 25px;">Order Confirmed</div>
            <div class="title">Payment Successful</div>
            <div class="message" style="color: #ccc; margin-bottom: 30px;">Thank you for your purchase. We've received your payment and the content has been unlocked in your account.</div>
            
            <div style="background: #111; padding: 25px; border-radius: 10px; border: 1px solid #333; text-align: left; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #fff;"><strong>Item:</strong> ${itemData.itemTitle}</p>
                <p style="margin: 0 0 10px 0; color: #fff;"><strong>Order ID:</strong> #${itemData.orderId}</p>
                <p style="margin: 0; color: #d4af37;"><strong>Total Paid:</strong> ₹${itemData.amount}</p>
            </div>
            
            <div style="margin-top: 30px;">
                <a href="${itemData.itemUrl}" class="btn">Access Content</a>
            </div>
            
            <p style="font-size: 11px; color: #666; margin-top: 30px;">If the button above doesn't work, you can always find your purchases in your profile section.</p>
        `;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'payment_pending') {
        const content = `
            <div style="text-transform: uppercase; color: #d4af37; font-size: 13px; letter-spacing: 4px; font-weight: 600; margin-bottom: 25px;">Notice</div>
            <div class="title">Payment Pending</div>
            <div class="message" style="color: #ccc; margin-bottom: 30px;">We noticed that your transaction for <strong>${itemData.itemTitle}</strong> was not completed.</div>
            
            <div style="background: #111; padding: 20px; border-radius: 8px; border: 1px solid #333; margin: 20px 0; text-align: left;">
                <p style="color: #fff; margin: 0 0 5px 0;"><strong>Order ID:</strong> #${itemData.orderId}</p>
                <p style="color: #666; font-size: 12px; margin: 0;">Status: Initiated</p>
            </div>
            
            <div class="message" style="color: #888;">If you were trying to pay and encountered an issue, feel free to try again from the catalog.</div>
            
            <div style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://qalamekahani.com'}" class="btn">View Catalog</a>
            </div>
        `;
        finalHtml = getPremiumTemplate(content);
    } else {
        finalHtml = getPremiumTemplate(`<div class="message">${message}</div>`);
    }

    try {
        console.log(`[EMAIL DEBUG] Preparing to send ${type} email via Brevo API to: ${email}`);
        
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) throw new Error('BREVO_API_KEY is missing');

        const senderEmail = process.env.EMAIL_USERNAME || 'sabirkhanp646@gmail.com';

        const body = {
            sender: { name: "Qalamekahani", email: senderEmail },
            to: [{ email: email }],
            subject: subject,
            htmlContent: finalHtml
        };

        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('[EMAIL] Sent successfully via Brevo API:', data.messageId);
            return data;
        } else {
            console.error('[EMAIL ERROR] Brevo API Refused:', data);
            throw new Error(data.message || 'Brevo API Error');
        }
    } catch (err) {
        console.error('[EMAIL ERROR] Fatal Error in sendEmail:', err.message);
        throw err;
    }
};

module.exports = { sendEmail };

