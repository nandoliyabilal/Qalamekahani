console.log('>>> APPLICATION STARTING UP - ATTEMPTING TO START SERVER <<<');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const path = require('path');

console.log('>>> [1] CORE MODULES LOADED <<<');

// Load env vars
dotenv.config();
console.log('>>> [2] ENV VARS LOADED <<<');

// Create App
const app = express();

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(xss());

console.log('>>> [3] BASIC MIDDLEWARE SET <<<');

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

console.log('>>> [4] SECURITY & CORS SET <<<');

// Static Routes - ADJUSTED FOR ROOT DEPLOYMENT
// Since app starts at root, we serve files from current directory
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.use('/admin', express.static(path.join(process.cwd(), 'admin')));
app.use(express.static(path.join(process.cwd())));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

console.log('>>> [5] STATIC ROUTES SET <<<');

const { errorHandler } = require('./backend/middleware/errorMiddleware');

console.log('>>> [6] ERROR HANDLER LOADED <<<');

// Routes - All prefixed with ./backend/
console.log('>>> [7] ATTEMPTING TO LOAD ROUTES <<<');
app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/admin', require('./backend/routes/adminRoutes'));
app.use('/api/stories', require('./backend/routes/storyRoutes'));
app.use('/api/blogs', require('./backend/routes/blogRoutes'));
app.use('/api/audio', require('./backend/routes/audioRoutes'));
app.use('/api/upload', require('./backend/routes/uploadRoutes'));
app.use('/api/books', require('./backend/routes/bookRoutes'));
app.use('/api/categories', require('./backend/routes/categoryRoutes'));
app.use('/api/reviews', require('./backend/routes/reviewRoutes'));
app.use('/api/settings', require('./backend/routes/settingsRoutes'));
app.use('/api/analytics', require('./backend/routes/analyticsRoutes'));
app.use('/api/orders', require('./backend/routes/orderRoutes'));
app.use('/api/contact', require('./backend/routes/contactRoutes'));
app.use('/api/gallery', require('./backend/routes/galleryRoutes'));
app.use('/api/notifications', require('./backend/routes/notificationRoutes'));

console.log('>>> [8] ALL ROUTES LOADED SUCCESSFULLY <<<');

const PORT = process.env.PORT || 5000;

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`>>> [9] SERVER SUCCESSFULLY RUNNING ON PORT ${PORT} <<<`);
});

