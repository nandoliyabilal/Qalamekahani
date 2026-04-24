const { sendEmail } = require('../backend/utils/emailService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const testResend = async () => {
    try {
        console.log('Testing Email with Resend API (Verified Domain)...');
        const result = await sendEmail({
            email: 'sabirkhanp646@gmail.com',
            subject: 'Domain Verified - Qalamekahani',
            message: 'Your domain is now verified and emails are working via Resend!',
            type: 'otp',
            itemData: {}
        });
        console.log('SUCCESS:', result);
    } catch (err) {
        console.error('FAILED:', err.message);
    }
};

testResend();
