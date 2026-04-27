const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require('crypto');

// Helper: Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const { sendEmail } = require('../utils/emailService');

// @desc    Register new user & Send OTP
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await db.execute(
        'INSERT INTO users (name, email, password, otp, otp_expire, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, otp, otpExpire, false]
    );

    // Send OTP
    try {
        await sendEmail({
            email,
            subject: 'Verify Your Email - Qalamekahani',
            message: otp,
            type: 'otp'
        });
        res.status(201).json({ success: true, message: `Verification code sent to ${email}`, email });
    } catch (emailError) {
        console.error('Email Error:', emailError);
        res.status(201).json({ success: true, message: `User created but email failed. Debug OTP: ${otp}`, email });
    }
});

// @desc    Verify OTP
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.is_verified) {
        res.status(400);
        throw new Error('User already verified');
    }

    const now = new Date();
    const expireTime = user.otp_expire ? new Date(user.otp_expire) : null;

    if (user.otp === otp && expireTime && expireTime > now) {
        await db.execute(
            'UPDATE users SET is_verified = true, otp = NULL, otp_expire = NULL WHERE id = ?',
            [user.id]
        );

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user.id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }
});

// @desc    Resend OTP
const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    await db.execute('UPDATE users SET otp = ?, otp_expire = ? WHERE id = ?', [otp, otpExpire, user.id]);

    try {
        await sendEmail({ email: user.email, subject: 'New Verification Code', message: otp, type: 'otp' });
        res.json({ success: true, message: 'New code sent' });
    } catch (e) {
        res.status(500);
        throw new Error('Failed to send email');
    }
});

// @desc    Authenticate user
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (user && user.is_blocked) {
        res.status(403);
        throw new Error('Account blocked');
    }

    if (user && (await bcrypt.compare(password, user.password))) {
        if (!user.is_verified) {
            res.status(401);
            throw new Error('Email not verified');
        }

        await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id)
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Google Login
const googleLogin = asyncHandler(async (req, res) => {
    const { token } = req.body;

    let payload;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (error) {
        res.status(401);
        throw new Error('Invalid Google token');
    }

    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const googleId = payload.sub;

    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    let user = users[0];

    if (user && user.is_blocked) {
        res.status(403);
        throw new Error('Account blocked');
    }

    if (!user) {
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, is_verified, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, 'google-auth-no-password', true, 'user']
        );
        const [newUsers] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
        user = newUsers[0];
    }

    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
    });
});

// @desc    Get Me
const getMe = asyncHandler(async (req, res) => {
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Helper to fetch details from JSON column
    const fetchDetails = async (table, rawIds) => {
        let ids = [];
        try {
            ids = typeof rawIds === 'string' ? JSON.parse(rawIds) : (rawIds || []);
        } catch (e) { ids = []; }
        if (!ids || ids.length === 0) return [];
        const uniqueIds = [...new Set(ids)];
        const placeholders = uniqueIds.map(() => '?').join(',');
        const [rows] = await db.execute(`SELECT id, title, image, category FROM ${table} WHERE id IN (${placeholders})`, uniqueIds);
        return rows;
    };

    const [likedStories, savedAudios, savedImages] = await Promise.all([
        fetchDetails('stories', user.liked_stories),
        fetchDetails('audio_stories', user.saved_audios),
        fetchDetails('gallery', user.saved_images)
    ]);

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        likedStories,
        savedAudios,
        savedImages,
        notificationsOn: user.notifications_on
    });
});

// @desc    Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    await db.execute(
        'UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?',
        [otp, otpExpire, user.id]
    );

    try {
        await sendEmail({ email: user.email, subject: 'Password Reset OTP', message: otp, type: 'otp' });
        res.json({ success: true, message: 'OTP sent' });
    } catch (e) {
        res.status(500);
        throw new Error('Failed to send email');
    }
});

// @desc    Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user || user.reset_password_token !== otp) {
        res.status(400);
        throw new Error('Invalid OTP');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.execute(
        'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?',
        [hashedPassword, user.id]
    );

    res.json({ success: true, message: 'Password reset successful' });
});

// @desc    Like/Save actions
const toggleAction = (table, column) => asyncHandler(async (req, res) => {
    const itemId = req.body.id || req.body.storyId || req.body.blogId || req.body.audioId || req.body.imageId;
    const [users] = await db.execute(`SELECT ${column} FROM users WHERE id = ?`, [req.user.id]);
    let list = [];
    try {
        list = typeof users[0][column] === 'string' ? JSON.parse(users[0][column]) : (users[0][column] || []);
    } catch (e) { list = []; }

    const strId = String(itemId);
    if (list.includes(strId)) {
        list = list.filter(id => id !== strId);
    } else {
        list.push(strId);
    }

    await db.execute(`UPDATE users SET ${column} = ? WHERE id = ?`, [JSON.stringify(list), req.user.id]);
    res.json({ success: true, [column]: list });
});

const likeStory = toggleAction('stories', 'liked_stories');
const saveBlog = toggleAction('stories', 'saved_blogs');
const saveAudio = toggleAction('audio_stories', 'saved_audios');
const saveImage = toggleAction('gallery', 'saved_images');
const trackAudio = asyncHandler(async (req, res) => {
    const { audioId } = req.body;
    const [users] = await db.execute('SELECT listened_audios FROM users WHERE id = ?', [req.user.id]);
    let list = [];
    try {
        list = typeof users[0].listened_audios === 'string' ? JSON.parse(users[0].listened_audios) : (users[0].listened_audios || []);
    } catch (e) { list = []; }
    if (!list.includes(String(audioId))) {
        list.push(String(audioId));
        await db.execute('UPDATE users SET listened_audios = ? WHERE id = ?', [JSON.stringify(list), req.user.id]);
    }
    res.json({ success: true });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        updates.push('password = ?');
        values.push(hashed);
    }

    if (updates.length > 0) {
        values.push(req.user.id);
        await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [newUsers] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json(newUsers[0]);
});

const getAllUsers = asyncHandler(async (req, res) => {
    const [users] = await db.execute('SELECT id, name, email, role, is_verified, is_blocked, created_at FROM users WHERE role = "user"');
    res.json(users);
});

const getUserById = asyncHandler(async (req, res) => {
    const [users] = await db.execute('SELECT id, name, email, role, is_verified, is_blocked, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json(users[0]);
});

const toggleBlockUser = asyncHandler(async (req, res) => {
    await db.execute('UPDATE users SET is_blocked = ? WHERE id = ?', [req.body.block, req.params.id]);
    res.json({ success: true });
});

const toggleNotifications = asyncHandler(async (req, res) => {
    await db.execute('UPDATE users SET notifications_on = ? WHERE id = ?', [req.body.status, req.user.id]);
    res.json({ success: true });
});

// @desc    Initiate Admin Login
const initiateAdminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
    const user = users[0];

    if (user && (await bcrypt.compare(password, user.password))) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

        await db.execute('UPDATE users SET otp = ?, otp_expire = ? WHERE id = ?', [otp, otpExpire, user.id]);

        try {
            await sendEmail({ email: user.email, subject: 'Admin Login OTP', message: otp, type: 'otp' });
        } catch (e) {
            console.error('Admin OTP failed but continuing for debug');
        }

        res.json({ success: true, message: 'OTP sent to admin email' });
    } else {
        res.status(401);
        throw new Error('Invalid admin credentials');
    }
});

// @desc    Verify Admin Login OTP
const verifyAdminLogin = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
    const user = users[0];

    if (!user || user.otp !== otp) {
        res.status(401);
        throw new Error('Invalid or expired OTP');
    }

    await db.execute('UPDATE users SET otp = NULL, otp_expire = NULL, last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
    });
});

// @desc    Verify Reset Password OTP
const verifyResetOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user || user.reset_password_token !== otp) {
        res.status(400);
        throw new Error('Invalid OTP');
    }

    res.json({ success: true, message: 'OTP verified' });
});

module.exports = {
    registerUser, verifyOtp, resendOtp, loginUser, googleLogin, getMe, updateProfile,
    forgotPassword, resetPassword, verifyResetOtp, initiateAdminLogin, verifyAdminLogin,
    likeStory, saveBlog, saveAudio, saveImage, trackAudio,
    getAllUsers, getUserById, toggleBlockUser, toggleNotifications
};
registerUser, verifyOtp, resendOtp, loginUser, googleLogin, getMe, updateProfile,
    forgotPassword, resetPassword, verifyResetOtp, initiateAdminLogin, verifyAdminLogin,
    likeStory, saveBlog, saveAudio, saveImage, trackAudio,
    getAllUsers, getUserById, toggleBlockUser, toggleNotifications
};
