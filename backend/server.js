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
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
    next();
});
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
const fs = require('fs');

// Calculate the absolute path to the project root (one level up from /backend)
const projectRoot = path.resolve(__dirname, '..');

// Basic Route
app.get('/', (req, res) => {
    const indexPath = path.join(projectRoot, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Home page (index.html) not found in ' + projectRoot);
    }
});

// Serve Admin Panel
app.use('/admin', express.static(path.join(projectRoot, 'admin')));

// Serve Main Website Static Files
app.use(express.static(projectRoot));

// Serve Uploads Directory
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));

const { errorHandler } = require('./middleware/errorMiddleware');

// Routes
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
app.use('/api/notifications', require('./routes/notificationRoutes'));

const PORT = process.env.PORT || 5000;

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
