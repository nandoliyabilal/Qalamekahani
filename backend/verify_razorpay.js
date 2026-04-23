const dotenv = require('dotenv');
const path = require('path');
const Razorpay = require('razorpay');

// Explicitly load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('--- Razorpay Debugger ---');
if (!keyId || !keySecret) {
    console.log('❌ Error: Razorpay Keys NOT FOUND in .env file!');
    process.exit(1);
}

console.log(`✅ Key ID Found: ${keyId.substring(0, 10)}...`);
console.log(`✅ Key Secret Found: ${keySecret.substring(0, 5)}...`);

const rzp = new Razorpay({
    key_id: keyId.trim(),
    key_secret: keySecret.trim()
});

console.log('Testing connection to Razorpay API...');
rzp.orders.all({ count: 1 })
    .then(() => {
        console.log('🚀 SUCCESS: Razorpay Authentication Working!');
    })
    .catch(err => {
        console.log('❌ FAILURE: Razorpay Authentication Failed!');
        console.log('Error Details:', JSON.stringify(err));
    });
