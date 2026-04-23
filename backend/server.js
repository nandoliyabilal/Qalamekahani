const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load env vars from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });
// fallback if first one fails
if (!process.env.RAZORPAY_KEY_ID) {
    dotenv.config();
}

const app = express();

// Trust Proxy (Essential for Hostinger/Proxied environments)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 1000 
});
app.use(limiter);
app.use(cors());

// Security: Prevent access to backend source
app.use(['/backend', '/.env', '/.git'], (req, res) => {
    res.status(403).send('Forbidden');
});

// Static Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.use('/admin', express.static(path.join(process.cwd(), 'admin')));
app.use(express.static(path.join(process.cwd())));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const db = require('./config/mysql_db');

// Test Database Connection on Startup
(async () => {
    try {
        const [rows] = await db.execute('SELECT 1 + 1 AS result');
        console.log('✅ MySQL Database Connected Successfully');
    } catch (err) {
        console.error('❌ MySQL Connection Failed:', err.message);
        console.error('Check your .env MYSQL_ credentials in Hostinger panel.');
    }
})();

const { errorHandler } = require('./middleware/errorMiddleware');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
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
app.use('/api/notifications', require('./routes/notificationRoutes'));

const PORT = process.env.PORT || 5000;

app.use(errorHandler);

// Global Error Listeners to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION:', reason);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`App Directory: ${process.cwd()}`);
});



