const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const Settings = require('./models/Settings');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // 1. Create/Update Admin User
        const adminEmail = 'sabirkhanp646@gmail.com';
        const adminPass = 'sabirkhan@786';
        const adminName = 'Sabirkhan Pathan';

        // REMOVE other admins first
        await User.deleteMany({ role: 'admin', email: { $ne: adminEmail } });
        console.log('Cleaned up other admin accounts.');

        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            console.log('Target Admin user exists. Updating password/role...');
            adminUser.name = adminName;
            adminUser.isAdmin = true;
            adminUser.role = 'admin';

            const salt = await bcrypt.genSalt(10);
            adminUser.password = await bcrypt.hash(adminPass, salt);

            await adminUser.save();
            console.log('Target Admin user updated (PASSWORD HASHED).');
        } else {
            console.log('Creating Target Admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPass, salt);

            await User.create({
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isAdmin: true
            });
            console.log('Target Admin user created (PASSWORD HASHED).');
        }

        // 2. Create/Update Default Settings
        let settings = await Settings.findOne();
        if (!settings) {
            console.log('Creating default settings...');
            await Settings.create({});
            console.log('Default settings created.');
        } else {
            console.log('Settings already exist.');
        }

        console.log('Seeding completed successfully.');
        process.exit();

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
