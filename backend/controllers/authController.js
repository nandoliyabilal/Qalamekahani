const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase'); // Switched to Supabase
const crypto = require('crypto');

// Helper: Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const { sendEmail } = require('../utils/emailService');

// @desc    Register new user & Send OTP
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists in Supabase
    const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes window

    // Create user in Supabase
    const { data: user, error } = await supabase
        .from('users')
        .insert([{
            name,
            email,
            password: hashedPassword,
            otp,
            otp_expire: otpExpire,
            is_verified: false,
            notifications_on: true // Default ON for new users
        }])
        .select()
        .single();
    
    // LOG OTP FOR DEVELOPMENT (In case email service fails)
    console.log(`\n--- [AUTH DEBUG] ---`);
    console.log(`User: ${name} (${email})`);
    console.log(`Generated OTP: ${otp}`);
    console.log(`--------------------\n`);

    if (error || !user) {
        res.status(400);
        throw new Error(error?.message || 'Invalid user data');
    }

    // Send Premium OTP Email
    try {
        await sendEmail({
            email: user.email,
            subject: 'Verify Your Email - Qalamekahani',
            message: otp,
            type: 'otp'
        });

        res.status(201).json({
            success: true,
            message: `Verification code sent to ${user.email}`,
            email: user.email
        });
    } catch (emailError) {
        console.error('[AUTH] Registration Email Error:', emailError);
        // Delete user if email fails to allow retry
        await supabase.from('users').delete().eq('id', user.id);
        res.status(500);
        throw new Error(`Verification email failed: ${emailError.message}. Note: Resend free tier only allows sending to your own verified email.`);
    }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.is_verified) {
        res.status(400);
        throw new Error('User already verified. Please login.');
    }

    const now = Date.now();
    const expireTime = user.otp_expire ? new Date(user.otp_expire).getTime() : 0;

    // Robust comparison
    const isOtpValid = user.otp && String(user.otp) === String(otp);
    const isNotExpired = expireTime > now;

    if (isOtpValid && isNotExpired) {
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_verified: true,
                otp: null,
                otp_expire: null
            })
            .eq('id', user.id);

        if (updateError) {
            res.status(500);
            throw new Error('Verification failed');
        }

        // Send Welcome Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Welcome to Qalamekahani!',
                type: 'welcome',
                itemData: { name: user.name }
            });
        } catch (e) {
            console.error('[AUTH] Welcome Email Error:', e);
        }

        res.json({
            success: true,
            _id: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user.id)
        });
    } else {
        res.status(400);
        throw new Error(!isOtpValid ? 'Invalid OTP' : 'OTP has expired');
    }
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.is_verified) {
        res.status(400);
        throw new Error('User already verified');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
        .from('users')
        .update({ otp, otp_expire: otpExpire })
        .eq('id', user.id);

    if (updateError) {
        res.status(500);
        throw new Error('Failed to update OTP');
    }

    try {
        await sendEmail({
            email: user.email,
            subject: 'New Verification Code - Qalamekahani',
            message: otp,
            type: 'otp'
        });
        res.json({ success: true, message: 'New code sent to your email.' });
    } catch (sendError) {
        console.error('[AUTH] Resend Email Error:', sendError);
        res.status(500);
        throw new Error('Failed to send verification code.');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (user && (await bcrypt.compare(password, user.password))) {
        if (!user.is_verified) {
            // Automatically generate and send a NEW OTP for login attempt of unverified accounts
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpire = new Date(Date.now() + 15 * 60 * 1000).toISOString();

            await supabase
                .from('users')
                .update({ otp, otp_expire: otpExpire })
                .eq('id', user.id);

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify Your Identity - Qalamekahani',
                    message: otp,
                    type: 'otp'
                });
            } catch (e) {
                console.error('[AUTH] Login Auto-OTP Error:', e);
            }

            res.status(401);
            throw new Error('Email not verified. A new verification code has been sent to your email.');
        }

        // Update Last Login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        res.json({
            _id: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            likedCount: user.liked_stories ? user.liked_stories.length : 0,
            savedCount: user.saved_blogs ? user.saved_blogs.length : 0,
            notificationsOn: user.notifications_on,
            token: generateToken(user.id)
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Initiate Admin Login (Send OTP)
// @route   POST /api/auth/admin-login-init
// @access  Public
const initiateAdminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (user && (await bcrypt.compare(password, user.password))) {
        if (user.role !== 'admin') {
            res.status(403);
            throw new Error('Access Denied: You are not an Admin');
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // 15 minutes expiry for robustness
        const otpExpire = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        const { data: updateResult, error: updateError } = await supabase
            .from('users')
            .update({ otp, otp_expire: otpExpire })
            .eq('email', email) // Using email for safer update
        if (updateError) {
            console.error('[AUTH] DB Update Error:', updateError);
            res.status(500);
            throw new Error('Failed to save security code');
        }

        try {
            console.log(`[AUTH] Admin Login OTP for ${user.email}: ${otp}`); // Added console log for OTP
            await sendEmail({
                email: user.email,
                subject: 'Admin Login OTP - Qalamekahani',
                message: otp,
                type: 'otp'
            });
            res.json({ success: true, message: 'OTP sent to your email' });
        } catch (sendError) {
            console.error('[AUTH] Email error:', sendError);
            res.status(500);
            throw new Error('Failed to send security code. Please check your network.');
        }
    } else {
        res.status(401);
        throw new Error('Invalid Admin credentials');
    }
});

// @desc    Verify Admin OTP & Login
// @route   POST /api/auth/admin-login-verify
// @access  Public
const verifyAdminLogin = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        res.status(404);
        throw new Error('User not found');
    }

    const now = Date.now();
    // Ensure we parse the timestamp correctly
    const expireTime = user.otp_expire ? new Date(user.otp_expire).getTime() : 0;

    const isOtpMatch = user.otp && String(user.otp).trim() === String(otp).trim();
    const isNotExpired = expireTime > now;

    if (isOtpMatch && isNotExpired) {
        await supabase
            .from('users')
            .update({
                otp: null,
                otp_expire: null,
                last_login: new Date().toISOString()
            })
            .eq('id', user.id);

        res.json({
            _id: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id)
        });
    } else {
        res.status(400);
        const errorMsg = !isOtpMatch ? 'Invalid security code' : 'Security code has expired';
        throw new Error(errorMsg);
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    console.log(`[ME] Fetching profile for user ID: ${req.user.id}`);
    
    // 1. Get User from Supabase
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

    if (error || !user) {
        console.error(`[ME] User not found or error:`, error);
        res.status(404);
        throw new Error('User not found');
    }

    // 2. Helper to fetch details with fallback and logging
    const fetchDetails = async (table, ids) => {
        if (!ids || ids.length === 0) return [];
        const uniqueIds = [...new Set(ids.filter(id => id).map(id => String(id)))];
        if (uniqueIds.length === 0) return [];

        let fields = 'id, title, image, category';
        if (table === 'stories' || table === 'blogs') fields += ', slug';

        try {
            // Attempt 1: Fetch by ID
            let { data, error } = await supabase.from(table).select(fields).in('id', uniqueIds);
            
            // Attempt 2: If many missing (likely old slugs/IDs), try slug
            const hasSlug = table === 'stories' || table === 'blogs';
            if (hasSlug && (!data || data.length < uniqueIds.length)) {
                const foundIds = data ? data.map(d => String(d.id)) : [];
                const missingIds = uniqueIds.filter(id => !foundIds.includes(id));
                if (missingIds.length > 0) {
                    const { data: bySlug } = await supabase.from(table).select(fields).in('slug', missingIds);
                    if (bySlug) data = [...(data || []), ...bySlug];
                }
            }
            return data || [];
        } catch (err) {
            console.error(`[ME] Error fetching from ${table}:`, err);
            return [];
        }
    };

    // 3. Parallel fetch of all linked data
    const [likedStories, savedBlogs, savedAudios, savedImagesDetails] = await Promise.all([
        fetchDetails('stories', user.liked_stories),
        fetchDetails('blogs', user.saved_blogs),
        fetchDetails('audio_stories', user.saved_audios),
        fetchDetails('galleries', user.saved_images)
    ]);

    // 4. Construct Clean Profile Object
    const responseData = {
        id: user.id,
        name: user.name || 'User',
        email: user.email,
        role: user.role,
        notificationsOn: user.notifications_on,
        likedStories: likedStories,
        savedBlogs: savedBlogs,
        savedAudios: savedAudios,
        savedImages: savedImagesDetails,
        likedCount: likedStories.length,
        savedCount: savedBlogs.length
    };

    console.log(`[ME] Success: Returning profile for ${user.email}`);
    res.status(200).json(responseData);
});

// @desc    Like a Story
// @route   POST /api/auth/like-story
// @access  Private
const likeStory = asyncHandler(async (req, res) => {
    const { storyId } = req.body;
    const { data: user } = await supabase.from('users').select('liked_stories').eq('id', req.user.id).single();

    let likedStories = user.liked_stories || [];
    if (likedStories.includes(storyId)) {
        likedStories = likedStories.filter(id => id !== storyId);
    } else {
        likedStories.push(storyId);
    }

    const { error } = await supabase.from('users').update({ liked_stories: likedStories }).eq('id', req.user.id);
    if (error) throw new Error('Failed to update likes');

    res.json({ success: true, likedStories });
});

// @desc    Save a Blog
// @route   POST /api/auth/save-blog
// @access  Private
const saveBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    const { data: user } = await supabase.from('users').select('saved_blogs').eq('id', req.user.id).single();

    let savedBlogs = user.saved_blogs || [];
    if (savedBlogs.includes(blogId)) {
        savedBlogs = savedBlogs.filter(id => id !== blogId);
    } else {
        savedBlogs.push(blogId);
    }

    const { error } = await supabase.from('users').update({ saved_blogs: savedBlogs }).eq('id', req.user.id);
    if (error) throw new Error('Failed to update saved blogs');

    res.json({ success: true, savedBlogs });
});

// @desc    Track Audio Listen
// @route   POST /api/auth/track-audio
// @access  Private
const trackAudio = asyncHandler(async (req, res) => {
    const { audioId } = req.body;
    const { data: user } = await supabase.from('users').select('listened_audios').eq('id', req.user.id).single();

    let listenedAudios = user.listened_audios || [];
    if (!listenedAudios.includes(audioId)) {
        listenedAudios.push(audioId);
        await supabase.from('users').update({ listened_audios: listenedAudios }).eq('id', req.user.id);
    }
    res.json({ success: true, listenedAudios });
});

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { data: user } = await supabase.from('users').select('*').eq('email', req.body.email).single();

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('users').update({
        reset_password_token: resetPasswordToken,
        reset_password_expire: resetPasswordExpire
    }).eq('id', user.id);

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    const message = `You requested a password reset. Please go to: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset - Qalamekahani',
            type: 'password_reset',
            itemData: { resetUrl }
        });
        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        await supabase.from('users').update({
            reset_password_token: null,
            reset_password_expire: null
        }).eq('id', user.id);
        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('reset_password_token', resetToken)
        .gt('reset_password_expire', new Date().toISOString())
        .single();

    if (!user) {
        res.status(400);
        throw new Error('Invalid token');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    await supabase.from('users').update({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expire: null
    }).eq('id', user.id);

    res.status(201).json({
        success: true,
        token: generateToken(user.id),
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();

    if (user) {
        const updates = {
            name: req.body.name || user.name,
            email: req.body.email || user.email
        };

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw new Error('Update failed');

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser.id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get All Users (Admin)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('role', 'user')
        .order('created_at', { ascending: false });
    res.json(users);
});

// @desc    Get User By ID (Admin)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const { data: user } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('id', req.params.id)
        .single();
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Save an Audio Story
// @route   POST /api/auth/save-audio
// @access  Private
const saveAudio = asyncHandler(async (req, res) => {
    const { audioId } = req.body;

    if (!audioId) {
        res.status(400);
        throw new Error('Audio ID is required');
    }

    const { data: user } = await supabase.from('users').select('saved_audios').eq('id', req.user.id).single();
    let savedAudios = user.saved_audios || [];

    const strAudioId = String(audioId);
    const existingIndex = savedAudios.findIndex(id => String(id) === strAudioId);

    if (existingIndex > -1) {
        savedAudios.splice(existingIndex, 1);
    } else {
        savedAudios.push(strAudioId);
    }

    await supabase.from('users').update({ saved_audios: savedAudios }).eq('id', req.user.id);

    res.json({
        success: true,
        savedAudios: savedAudios.map(id => String(id))
    });
});

// @desc    Save an Image
// @route   POST /api/auth/save-image
// @access  Private
const saveImage = asyncHandler(async (req, res) => {
    const { imageId } = req.body;

    if (!imageId) {
        res.status(400);
        throw new Error('Image ID is required');
    }

    const { data: user } = await supabase.from('users').select('saved_images').eq('id', req.user.id).single();
    let savedImages = user.saved_images || [];

    const strImageId = String(imageId);
    const existingIndex = savedImages.findIndex(id => String(id) === strImageId);

    if (existingIndex > -1) {
        savedImages.splice(existingIndex, 1);
    } else {
        savedImages.push(strImageId);
    }

    await supabase.from('users').update({ saved_images: savedImages }).eq('id', req.user.id);

    res.json({
        success: true,
        savedImages: savedImages.map(id => String(id))
    });
});


// @desc    Toggle Notifications
// @route   POST /api/auth/toggle-notifications
// @access  Private
const toggleNotifications = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const { error } = await supabase
        .from('users')
        .update({ notifications_on: status })
        .eq('id', req.user.id);

    if (error) {
        res.status(400);
        throw new Error('Failed to update notification settings');
    }

    res.json({ success: true, notificationsOn: status });
});

// @desc    Google OAuth Login/Signup
// @route   POST /api/auth/google-login
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('Supabase token is required');
    }

    // 1. Verify token and get user info from Supabase server-side
    const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser(token);

    if (sbError || !sbUser) {
        res.status(401);
        throw new Error('Invalid or expired Supabase token');
    }

    const email = sbUser.email;
    const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];

    // 2. Check if user exists in OUR users table
    let { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (!user) {
        // 3. Create new user if doesn't exist
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
                name: name,
                email: email,
                is_verified: true, // Google accounts are verified
                notifications_on: true,
                role: 'user',
                last_login: new Date().toISOString()
            }])
            .select()
            .single();

        if (createError) {
            res.status(400);
            throw new Error(createError.message);
        }
        user = newUser;

        // Send Welcome Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Welcome to Qalamekahani!',
                type: 'welcome',
                itemData: { name: user.name }
            });
        } catch (e) {
            console.error('[AUTH] Google Welcome Email Error:', e);
        }
    } else {
        // 4. Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);
    }

    // 5. Generate Token
    res.json({
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        likedCount: user.liked_stories ? user.liked_stories.length : 0,
        savedCount: user.saved_blogs ? user.saved_blogs.length : 0,
        notificationsOn: user.notifications_on,
        token: generateToken(user.id)
    });
});

module.exports = {
    registerUser,
    loginUser,
    initiateAdminLogin,
    verifyAdminLogin,
    getMe,
    updateProfile,
    verifyOtp,
    resendOtp,
    likeStory,
    saveBlog,
    trackAudio,
    forgotPassword,
    resetPassword,
    getAllUsers,
    getUserById,
    saveAudio,
    saveImage,
    toggleNotifications,
    googleLogin
};
