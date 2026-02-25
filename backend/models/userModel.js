const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: String,
        otpExpire: Date,
        likedStories: [{
            type: String // Supabase UUID
        }],
        savedBlogs: [{
            type: String // Supabase UUID
        }],
        listenedAudios: [{
            type: String // Supabase UUID
        }],
        savedAudios: [{
            type: String // Supabase UUID
        }],
        lastLogin: {
            type: Date,
            default: Date.now
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);
