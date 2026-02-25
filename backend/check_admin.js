const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const admins = await User.find({ role: 'admin' });

        if (admins.length > 0) {
            console.log('Found Admin Users:');
            admins.forEach(admin => {
                console.log(`- Email: ${admin.email}`);
            });
            console.log('\nNote: Passwords are hashed and cannot be retrieved directly.');
        } else {
            console.log('No admin users found.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdmin();
