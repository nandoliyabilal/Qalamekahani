const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    console.log('Using API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
    console.log('Using EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('Sending to:', process.env.EMAIL_USERNAME || 'sabirkhanp646@gmail.com');

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: process.env.EMAIL_USERNAME || 'sabirkhanp646@gmail.com',
            subject: 'Test OTP - Qalamekahani',
            html: '<h1>123456</h1>'
        });

        if (error) {
            console.error('Test Failed Error:', error);
        } else {
            console.log('Test Success Data:', data);
        }
    } catch (err) {
        console.error('System Exception:', err);
    }
}

testEmail();
