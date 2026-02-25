const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('--- BACKEND CONFIGURATION CHECK ---');

// 1. Check for .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file missing!');
    process.exit(1);
} else {
    console.log('✅ .env file found.');
}

// 2. Load .env
dotenv.config({ path: envPath });

// 3. Check Variables
const requiredVars = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
let missingVars = [];

requiredVars.forEach(key => {
    if (!process.env[key] || process.env[key].includes('your_')) {
        missingVars.push(key);
    }
});

if (missingVars.length > 0) {
    console.error('❌ Missing or default configuration for:', missingVars.join(', '));
    console.log('   Please open backend/.env and add your actual API keys.');
} else {
    console.log('✅ Environment variables look configured.');
}

console.log('\n--- NEXT STEPS ---');
console.log('1. If all checks passed, run: npm start');
console.log('2. If MongoDB works, you will see "MongoDB Connected"');
console.log('-------------------------------');
