const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from MySQL
            const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
            const user = rows[0];

            if (!user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // Map MySQL fields (snake_case) to Frontend expected fields (camelCase)
            req.user = {
                ...user,
                isVerified: !!user.is_verified,
                likedStories: typeof user.liked_stories === 'string' ? JSON.parse(user.liked_stories) : (user.liked_stories || []),
                savedBlogs: typeof user.saved_blogs === 'string' ? JSON.parse(user.saved_blogs) : (user.saved_blogs || []),
                savedAudios: typeof user.saved_audios === 'string' ? JSON.parse(user.saved_audios) : (user.saved_audios || []),
                listenedAudios: typeof user.listened_audios === 'string' ? JSON.parse(user.listened_audios) : (user.listened_audios || [])
            };

            next();
        } catch (error) {
            console.error('[AUTH ERROR]', error.message);
            res.status(401);
            throw new Error('Not authorized');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

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
