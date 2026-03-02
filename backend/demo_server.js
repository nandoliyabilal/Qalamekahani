const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// MOCK Database Connection
const mongoose = require('mongoose');
mongoose.connect = async () => {
    console.log('🔶 DEMO MODE: Mock Database Connected successfully.');
    console.log('   (Note: Data will not be saved in this mode)');
    return true;
};

// Load env vars (or mock them if missing)
dotenv.config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts/images for demo
}));
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());

// FILE UPLOAD SETUP (Multer)
const multer = require('multer');
const fs = require('fs');

// Ensure images directory exists
const uploadDir = path.join(__dirname, '../images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = `images/${req.file.filename}`;
    res.json({ imageUrl });
});

// SERVE ADMIN PANEL (Production Build)
app.use('/admin', express.static(path.join(__dirname, '../admin-panel/dist')));
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin-panel/dist/index.html'));
});

// SERVE STATIC FRONTEND FILES (Root)
// SERVE STATIC FRONTEND FILES (Root)
app.use(express.static(path.join(__dirname, '../'))); // Serve files from Qalamverce root


// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100
});
app.use(limiter);
app.use(cors());

// --- IN MEMORY DATA (For Demo Mode) ---
// --- MOCK DATA ---
let storiesData = [
    {
        id: "silent-echo",
        title: "The Silent Echo",
        author: "Sabirkhan Pathan",
        category: "Horror",
        date: "Jan 25, 2024",
        image: "images/story-horror.png",
        synopsis: "An eerie silence falls over the village of Kuldhara every night...",
        slug: "silent-echo"
    },
    {
        id: "whispers-heart",
        title: "Whispers of the Heart",
        author: "Sabirkhan Pathan",
        category: "Romance",
        date: "Jan 20, 2024",
        image: "images/story-romance.png",
        synopsis: "Two souls separated by time, connected by a series of letters...",
        slug: "whispers-heart"
    },
    {
        id: "shadows-fog",
        title: "Shadows in the Fog",
        author: "Sabirkhan Pathan",
        category: "Mystery",
        date: "Jan 15, 2024",
        image: "images/story-horror.png",
        synopsis: "Detective Miller thought it was a cold case...",
        slug: "shadows-fog"
    }
];

// ... (Other data arrays) ...
let booksData = [
    {
        id: "echoes-eternity",
        title: "Echoes of Eternity",
        author: "Sabirkhan Pathan",
        image: "images/story-horror.png",
        category: "Mystery",
        originalPrice: 499,
        discountPercent: 40
    },
    {
        id: "silent-scream",
        title: "The Silent Scream",
        author: "Sabirkhan Pathan",
        image: "images/story-romance.png",
        category: "Mystery",
        originalPrice: 399,
        discountPercent: 25
    },
    {
        id: "golden-bird",
        title: "The Golden Bird",
        author: "Sabirkhan Pathan",
        image: "images/audio-gold.png",
        category: "Drama",
        originalPrice: 599,
        discountPercent: 50
    }
];

let audioData = [
    {
        id: "audio-1",
        title: "The Night Train",
        duration: "12:30",
        image: "images/audio-train.png",
        category: "Mystery"
    },
    {
        id: "audio-2",
        title: "Rainy Day Jazz",
        duration: "45:00",
        image: "images/audio-rain.png",
        category: "Relaxation"
    }
];

// 1. Stories API (Mock)
app.get('/api/stories', (req, res) => res.json(storiesData));

app.post('/api/stories', (req, res) => {
    const newStory = {
        id: req.body.title.toLowerCase().replace(/ /g, '-'),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ...req.body
    };
    storiesData.unshift(newStory);
    res.status(201).json(newStory);
});

app.delete('/api/stories/:id', (req, res) => {
    storiesData = storiesData.filter(s => s.id !== req.params.id && s._id !== req.params.id);
    res.json({ message: 'Story deleted' });
});
app.get('/api/stories/:slug', (req, res) => {
    const story = storiesData.find(s => s.slug === req.params.slug || s.id === req.params.slug);
    if (story) res.json(story);
    else res.status(404).json({ message: 'Story not found' });
});

// 2. Books API (Mock)
app.get('/api/books', (req, res) => res.json(booksData));

app.post('/api/books', (req, res) => {
    const newBook = {
        id: req.body.title.toLowerCase().replace(/ /g, '-'),
        originalPrice: req.body.price, // Mapping price for demo
        ...req.body
    };
    booksData.unshift(newBook);
    res.status(201).json(newBook);
});

app.delete('/api/books/:id', (req, res) => {
    booksData = booksData.filter(b => b.id !== req.params.id && b._id !== req.params.id);
    res.json({ message: 'Book deleted' });
});


// 3. Audio API (Mock)
app.get('/api/audio', (req, res) => res.json(audioData));

app.post('/api/audio', (req, res) => {
    const newAudio = {
        id: req.body.title.toLowerCase().replace(/ /g, '-'),
        ...req.body
    };
    audioData.unshift(newAudio);
    res.status(201).json(newAudio);
});

app.delete('/api/audio/:id', (req, res) => {
    audioData = audioData.filter(a => a.id !== req.params.id && a._id !== req.params.id);
    res.json({ message: 'Audio deleted' });
});

// 3.5 Admin Stats API (Mock)
app.get('/api/admin/stats', (req, res) => {
    res.json({
        userCount: 1543,
        storyCount: storiesData.length,
        bookCount: booksData.length,
        audioCount: audioData.length,
        totalViews: 45200
    });
});

// Mock Users API
app.get('/api/users', (req, res) => {
    res.json([
        { id: 1, name: 'Admin User', email: 'admin@qalamekahani.com', role: 'Super Admin', status: 'Active' },
        { id: 2, name: 'Bilal Nandoliya', email: 'user@example.com', role: 'Editor', status: 'Active' },
        { id: 3, name: 'John Doe', email: 'john@gmail.com', role: 'User', status: 'Blocked' }
    ]);
});

// Mock Reviews API
app.get('/api/reviews', (req, res) => {
    res.json([]); // Empty reviews for now
});

// Mock Settings API
app.get('/api/settings', (req, res) => {
    res.json({ siteName: 'Qalamekahani', maintenanceMode: false });
});

// 4. Auth API (Mock - Always Success)
app.post('/api/auth/login', (req, res) => {
    res.json({
        _id: 'mock_user_id',
        name: 'Demo Admin',
        email: req.body.email,
        token: 'mock_jwt_token_12345'
    });
});
app.post('/api/auth/register', (req, res) => {
    res.json({
        _id: 'mock_user_id',
        name: req.body.name,
        email: req.body.email,
        token: 'mock_jwt_token_12345'
    });
});

// Keep other router imports commented/unused for now in this file to avoid DB errors
// app.use('/api/auth', require('./routes/authRoutes')); 
// ... etc

const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

const PORT = 5000;
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server successfully started on port ${PORT}`);
    console.log(`👉 Test URL: http://localhost:${PORT}`);
    console.log(`\nℹ️  This is a DEMO MODE server.`);
    console.log(`   It will keep running until you close this terminal.`);
    console.log(`   Use Ctrl+C to stop.`);
});
