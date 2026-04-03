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

const { errorHandler } = require('./middleware/errorMiddleware');

console.log('>>> [6] ERROR HANDLER LOADED <<<');

// Routes - All back to relative to server.js
console.log('>>> [7] ATTEMPTING TO LOAD ROUTES <<<');
console.log('>>> [7.1] Loading Auth Routes...');
app.use('/api/auth', require('./routes/authRoutes'));
console.log('>>> [7.2] Loading Admin Routes...');
app.use('/api/admin', require('./routes/adminRoutes'));
console.log('>>> [7.3] Loading Story Routes...');
app.use('/api/stories', require('./routes/storyRoutes'));
console.log('>>> [7.4] Loading Blog Routes...');
app.use('/api/blogs', require('./routes/blogRoutes'));
console.log('>>> [7.5] Loading Audio Routes...');
app.use('/api/audio', require('./routes/audioRoutes'));
console.log('>>> [7.6] Loading Upload Routes...');
app.use('/api/upload', require('./routes/uploadRoutes'));
console.log('>>> [7.7] Loading Book Routes...');
app.use('/api/books', require('./routes/bookRoutes'));
console.log('>>> [7.8] Loading Category Routes...');
app.use('/api/categories', require('./routes/categoryRoutes'));
console.log('>>> [7.9] Loading Review Routes...');
app.use('/api/reviews', require('./routes/reviewRoutes'));
console.log('>>> [7.10] Loading Settings Routes...');
app.use('/api/settings', require('./routes/settingsRoutes'));
console.log('>>> [7.11] Loading Analytics Routes...');
app.use('/api/analytics', require('./routes/analyticsRoutes'));
console.log('>>> [7.12] Loading Order Routes...');
app.use('/api/orders', require('./routes/orderRoutes'));
console.log('>>> [7.13] Loading Contact Routes...');
app.use('/api/contact', require('./routes/contactRoutes'));
console.log('>>> [7.14] Loading Gallery Routes...');
app.use('/api/gallery', require('./routes/galleryRoutes'));
console.log('>>> [7.15] Loading Notification Routes...');
app.use('/api/notifications', require('./routes/notificationRoutes'));

console.log('>>> [8] ALL ROUTES LOADED SUCCESSFULLY <<<');


const PORT = process.env.PORT || 5000;

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`>>> [9] SERVER SUCCESSFULLY RUNNING ON PORT ${PORT} <<<`);
});


