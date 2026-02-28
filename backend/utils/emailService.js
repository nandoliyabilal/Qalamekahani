const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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
        <title>QalamVerse</title>
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
            .image-container {
                margin: 0 0 30px;
                border-bottom: 2px solid #d4af37;
            }
            .feature-image {
                width: 100%;
                max-width: 100%;
                display: block;
            }
            .title {
                font-family: 'Playfair Display', serif;
                font-size: 28px;
                color: #ffffff;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #bbbbbb;
                margin-bottom: 35px;
            }
            .otp-code {
                display: inline-block;
                padding: 15px 30px;
                background: rgba(212, 175, 55, 0.1);
                border: 1px dashed #d4af37;
                color: #d4af37;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: 5px;
                margin: 20px 0;
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
                transition: background 0.3s;
            }
            .footer {
                padding: 30px;
                background-color: #000;
                text-align: center;
                color: #666;
                font-size: 11px;
                border-top: 1px solid #1a1a1a;
            }
            .social-links { margin-bottom: 20px; }
            .social-links a { color: #d4af37; text-decoration: none; margin: 0 10px; }

            /* Mobile Responsiveness */
            @media only screen and (max-width: 600px) {
                .content { width: 100% !important; border-left: none !important; border-right: none !important; }
                .body-content { padding: 25px 15px !important; }
                .header { padding: 30px 15px !important; }
                .logo { font-size: 26px !important; }
                .title { font-size: 24px !important; }
                .message { font-size: 15px !important; }
                .otp-box { padding: 15px 20px !important; font-size: 28px !important; letter-spacing: 4px !important; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="content">
                <div class="header">
                    <h1 class="logo">QalamVerse</h1>
                    <div class="tagline">Where Stories Come to Life</div>
                </div>
                
                <div class="body-content">
                    ${content}
                </div>
                
                <div class="footer">
                    <div style="margin-bottom: 20px;">
                        <a href="#" style="color: #666; text-decoration: underline; margin: 0 10px;">Privacy Policy</a>
                        <a href="#" style="color: #666; text-decoration: underline; margin: 0 10px;">Terms of Service</a>
                        <a href="#" style="color: #666; text-decoration: underline; margin: 0 10px;">Support</a>
                    </div>
                    <p style="margin-bottom: 5px;">QalamVerse Digital Platforms, Inc.</p>
                    <p style="margin-bottom: 5px;">123 Storyteller Lane, Creative District, Mumbai, India</p>
                    <p style="margin-top: 15px; color: #444;">&copy; 2026 QalamVerse. All Rights Reserved.</p>
                    <p style="margin-top: 10px; font-size: 10px; color: #333;">This is an automated system message. Please do not reply to this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
};

/**
 * Master Email Sender Utility
 */
const sendEmail = async ({ email, subject, message, html, type, itemData }) => {
    // The Resend SDK will be used instead of Nodemailer

    let finalHtml = html;

    // Type-based template generation if HTML is not provided or needs wrapping
    if (type === 'otp') {
        const content = `
            <div style="background: rgba(212, 175, 55, 0.05); border-radius: 12px; padding: 30px 20px; border: 1px solid rgba(212, 175, 55, 0.15);">
                <div style="text-transform: uppercase; color: #d4af37; font-size: 13px; letter-spacing: 4px; font-weight: 600; margin-bottom: 25px;">Identity Verification</div>
                <div class="title" style="margin-bottom: 15px; font-size: 28px; font-weight: 700;">Security Code</div>
                <div class="message" style="margin-bottom: 30px; line-height: 1.6; color: #cccccc; font-size: 16px;">To complete your session, please use the following one-time password (OTP). <strong>This code is strictly confidential.</strong></div>
                
                <div style="margin: 35px 0;">
                    <div class="otp-box" style="display: inline-block; padding: 20px 35px; background: #111111; border: 1px solid #d4af37; color: #d4af37; font-size: 42px; font-weight: 800; letter-spacing: 10px; border-radius: 6px; box-shadow: 0 8px 25px rgba(0,0,0,0.5); font-family: 'Courier New', Courier, monospace;">
                        ${message}
                    </div>
                </div>

                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #222222;">
                    <div style="font-size: 13px; color: #777777; font-style: italic; line-height: 1.5;">
                        This code is valid for 15 minutes. If you did not request this, please ignore this email or <a href="#" style="color: #d4af37; text-decoration: none; font-weight: 600;">contact support</a>.
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; font-size: 11px; color: #444444; text-align: left; line-height: 1.6; padding: 0 15px; border-left: 2px solid #222;">
                <strong>CONFIDENTIALITY NOTICE:</strong> This electronic transmission is intended only for the use of the individual or entity to which it is addressed and contains information that is privileged and confidential.
            </div>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (type === 'new_item') {
        const { title, summary, image, link, typeLabel } = itemData;
        const imgHtml = image ? `
            <div class="image-container">
                <img src="${image}" class="feature-image" alt="${title}">
            </div>` : '';

        const content = `
            ${imgHtml}
            <div style="text-transform: uppercase; color: #d4af37; font-size: 13px; letter-spacing: 3px; font-weight: 600; margin-bottom: 10px;">New ${typeLabel} Alert!</div>
            <div class="title" style="margin-bottom: 15px; font-size: 32px;">${title}</div>
            <div class="message" style="font-style: italic; color: #aaa; margin-bottom: 30px;">"${summary}"</div>
            <a href="${link}" class="btn" style="background: #d4af37; color: #000; padding: 12px 30px; border-radius: 4px; font-weight: 600; text-decoration: none;">${typeLabel === 'Audio' ? 'Listen Now' : 'Begin Reading'}</a>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (type === 'contact_admin') {
        const { name, userEmail, userMessage } = itemData;
        const content = `
            <div class="title">New Inquiry Form</div>
            <div style="text-align: left; background: #111; padding: 20px; border-left: 3px solid #d4af37; margin-bottom: 20px;">
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Message:</strong></p>
                <p style="color: #ccc; line-height: 1.6;">${userMessage}</p>
            </div>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (type === 'contact_user') {
        const { name, userMessage } = itemData;
        const content = `
            <div class="title">Message Received</div>
            <div class="message">Hi ${name}, thank you for reaching out to QalamVerse. We've received your message and our team will get back to you shortly.</div>
            <div style="text-align: left; background: #111; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                <p style="font-size: 13px; color: #888; margin-bottom: 10px;">Your Message:</p>
                <p style="color: #bbb; font-style: italic;">"${userMessage}"</p>
            </div>
            <a href="${process.env.FRONTEND_URL || 'https://qalamverse.com'}" class="btn">Explore More Stories</a>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (type === 'newsletter_admin') {
        const content = `
            <div class="title">New Subscriber!</div>
            <div class="message">Great news! Someone just joined the QalamVerse newsletter.</div>
            <div style="font-size: 18px; color: #fff; margin: 20px 0;"><strong>${itemData.email}</strong></div>
            <div style="color: #666; font-size: 12px;">Joined on: ${new Date().toLocaleString()}</div>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (type === 'password_reset') {
        const content = `
            <div class="title">Password Reset</div>
            <div class="message">You are receiving this email because we received a password reset request for your account.</div>
            <div class="message" style="margin-top: 20px; color: #888;">Go to the link below to set a new password:</div>
            <a href="${itemData.resetUrl}" class="btn">Reset Password</a>
            <div style="font-size: 12px; color: #666; margin-top: 30px;">If you did not request a password reset, no further action is required. This link will expire in 10 minutes.</div>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (type === 'welcome') {
        const content = `
            <div class="title">Welcome to QalamVerse!</div>
            <div class="message">Hi ${itemData.name}, we're thrilled to have you join our community of storytellers and dreamers.</div>
            <div class="message" style="margin-top: 20px; color: #888;">Your account has been successfully verified. You now have full access to our exclusive collection of stories, audiobooks, and more.</div>
            <a href="${process.env.FRONTEND_URL || 'https://qalamverse.com'}" class="btn">Start Your Journey</a>
            <div style="font-size: 12px; color: #666; margin-top: 30px;">Thank you for choosing QalamVerse. We hope our stories touch your soul.</div>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (type === 'payment_success') {
        const content = `
            <div class="title" style="color: #4caf50;">Payment Successful!</div>
            <div class="message">Thank you for your purchase. Your payment for <strong>${itemData.itemTitle}</strong> has been confirmed.</div>
            <div style="text-align: left; background: #111; padding: 20px; border-left: 3px solid #4caf50; margin: 25px 0;">
                <p><strong>Order ID:</strong> ${itemData.orderId}</p>
                <p><strong>Amount:</strong> ₹${itemData.amount}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <a href="${itemData.itemUrl || '#'}" class="btn">Access Your Item</a>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (type === 'payment_pending') {
        const content = `
            <div class="title" style="color: #d4af37;">Payment Pending/Cancelled</div>
            <div class="message">We noticed that your payment for <strong>${itemData.itemTitle}</strong> was not completed or is currently pending.</div>
            <div style="text-align: left; background: #111; padding: 20px; border-left: 3px solid #d4af37; margin: 25px 0;">
                <p><strong>Order ID:</strong> ${itemData.orderId}</p>
                <p><strong>Amount:</strong> ₹${itemData.amount}</p>
            </div>
            <div class="message" style="font-size: 14px; color: #888;">If you encountered an issue, you can try paying again from your profile or the checkout page. If you cancelled the payment, you can ignore this email.</div>
            <a href="${process.env.FRONTEND_URL || 'https://qalamverse.com'}/checkout.html" class="btn">Retry Payment</a>
        `;
        finalHtml = getPremiumTemplate(content);
    }
    else if (!finalHtml) {
        // Fallback for simple messages
        finalHtml = getPremiumTemplate(`<div class="message">${message || ''}</div>`);
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'QalamVerse <onboarding@resend.dev>', // Update to your domain once verified
            to: Array.isArray(email) ? email : [email],
            subject: subject,
            html: finalHtml,
            text: message || 'Please enable HTML to view this message.'
        });

        if (error) {
            console.error('[EMAIL ERROR] Resend Fail:', error);
            throw new Error(error.message);
        }

        return data;
    } catch (err) {
        console.error('[EMAIL ERROR] System Fail:', err.message);
        throw err;
    }
};

module.exports = { sendEmail };
