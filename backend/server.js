const express = require('express'); // Server Refreshed: 12:45
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Load env vars
dotenv.config();

// Supabase is loaded automatically via require in controllers/middleware
const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
})); // Set security headers with CSP disabled
app.use(express.json({ limit: '50mb' })); // Body parser with higher limit
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(mongoSanitize()); // Prevent NoSQL injection (Not needed)
app.use(xss()); // Prevent XSS attacks

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

app.use(cors());

// Security: Prevent access to backend source and env files
app.use(['/backend', '/.env', '/.git'], (req, res) => {
    res.status(403).send('Forbidden');
});

// Basic Route
const path = require('path');

// Basic Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Serve Admin Panel
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Serve Main Website Static Files
app.use(express.static(path.join(__dirname, '../')));

// Serve Uploads Directory (Important for Local Storage)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const { errorHandler } = require('./middleware/errorMiddleware');

// Import Routes
app.use((req, res, next) => {
    if (req.path === '/api/auth/me') {
        const oldJson = res.json;
        res.json = function (data) {
            console.log(`[DEBUG] /api/auth/me response for ${data.email}: Stories=${data.likedStories?.length}, Blogs=${data.savedBlogs?.length}, Audios=${data.savedAudios?.length}`);
            return oldJson.apply(res, arguments);
        };
    }
    next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); // Admin Stats
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/audio', require('./routes/audioRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));

const PORT = process.env.PORT || 5000;

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
