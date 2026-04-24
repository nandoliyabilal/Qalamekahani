const { sendEmail } = require('../backend/utils/emailService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const testEmail = async () => {
    try {
        console.log('Testing Email Service with Brevo API...');
        const result = await sendEmail({
            email: 'sabirkhanp646@gmail.com',
            subject: 'System Test - Qalamekahani',
            message: 'This is a test to verify if Brevo API is working.',
            type: 'otp',
            itemData: {}
        });
        console.log('SUCCESS:', result);
    } catch (err) {
        console.error('FAILED:', err.message);
        if (err.response) {
            console.error('RESPONSE:', err.response.data);
        }
    }
};

testEmail();
