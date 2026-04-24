// Using Resend API (HTTPS) for better limits and stability
const https = require('https');

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
                font-size: 28px;
                color: #d4af37;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin: 0;
                white-space: nowrap;
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

    // -- Template Logic (Same as before) --
    if (type === 'otp') {
        const content = `<div class="title">Security Code</div><div class="otp-box">${message}</div>`;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'password_reset_otp') {
        const content = `<div class="title">Reset Code</div><div class="otp-box">${message}</div>`;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'contact_admin') {
        const content = `<div class="title">New Inquiry</div><p>From: ${itemData.name} (${itemData.userEmail})</p><p>${itemData.userMessage}</p>`;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'contact_user') {
        const content = `<div class="title">Message Received</div><p>Hello ${itemData.name},</p><p>Thank you for reaching out to Qalamekahani. We have received your message and will get back to you shortly.</p><div style="padding: 15px; background: #111; border-left: 2px solid #d4af37; font-style: italic; margin-top: 20px;">"${itemData.userMessage}"</div>`;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'new_item') {
        const content = `<div class="title">New ${itemData.typeLabel}</div><h3>${itemData.title}</h3><p>${itemData.summary}</p><a href="${itemData.link}" class="btn">View Now</a>`;
        finalHtml = getPremiumTemplate(content);
    } else if (type === 'payment_success') {
        const content = `<div class="title">Payment Success</div><p>Order ID: #${itemData.orderId}</p><p>Amount: ₹${itemData.amount}</p>`;
        finalHtml = getPremiumTemplate(content);
    } else {
        finalHtml = getPremiumTemplate(`<div class="message">${message}</div>`);
    }

    return new Promise((resolve, reject) => {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) return reject(new Error('RESEND_API_KEY is missing'));

        // Important: RESEND MUST use a verified domain (info@qalamekahani.com)
        const senderEmail = "info@qalamekahani.com"; 

        const postData = JSON.stringify({
            from: "Qalamekahani <" + senderEmail + ">",
            to: [email],
            subject: subject,
            html: finalHtml
        });

        const options = {
            hostname: 'api.resend.com',
            path: '/emails',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`[EMAIL] Resend Success to ${email}:`, response.id);
                        resolve(response);
                    } else {
                        console.error('[EMAIL ERROR] Resend API Refused:', response);
                        reject(new Error(response.message || 'Resend API Error'));
                    }
                } catch (e) {
                    reject(new Error('Invalid JSON from Resend'));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
};

module.exports = { sendEmail };

module.exports = { sendEmail };

