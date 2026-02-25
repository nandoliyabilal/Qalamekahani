const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User');
const Settings = require('./backend/models/Settings');
const bcrypt = require('bcryptjs');

dotenv.config({ path: './backend/.env' });

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

        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            console.log('Admin user exists. Updating password/role...');
            adminUser.name = adminName;
            adminUser.isAdmin = true;
            adminUser.password = adminPass; // Will be hashed by pre-save hook? 
            // Better to hash manually if we are unsure about the hook triggering on save() without modification checks?
            // Actually, standard User models usually have pre('save') middleware.
            // Let's force proper hash just in case, or rely on model.
            // If I just save plain text, the model should hash it.

            // Wait, if I set it directly, I should ensure the model hash logic works.
            // Let's assume the User model has a pre-save hook.

            // BUT, if I don't want to rely on it:
            // const salt = await bcrypt.genSalt(10);
            // adminUser.password = await bcrypt.hash(adminPass, salt);

            // Let's rely on standard model behavior for now, usually safe.
            // Actually, let's look at authMiddleware... no, model.

            // Let's just save.
            await adminUser.save();
            console.log('Admin user updated.');
        } else {
            console.log('Creating new Admin user...');
            adminUser = await User.create({
                name: adminName,
                email: adminEmail,
                password: adminPass,
                isAdmin: true
            });
            console.log('Admin user created.');
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
