const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
// Mongoose model removed as we migrated to Supabase

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token using Supabase
            const supabase = require('../config/supabase');
            const { data: user, error: supabaseError } = await supabase
                .from('users')
                .select('*')
                .eq('id', decoded.id)
                .single();

            if (supabaseError || !user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // Map Supabase fields to what the app expects
            req.user = {
                ...user,
                // Handle naming differences between DB (snake_case) and App (camelCase)
                isVerified: user.is_verified,
                likedStories: user.liked_stories || [],
                savedBlogs: user.saved_blogs || [],
                savedAudios: user.saved_audios || [],
                listenedAudios: user.listened_audios || []
            };

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`User role ${req.user.role} is not authorized to access this route`);
        }
        next();
    };
};

module.exports = { protect, authorize };
