const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
    siteName: { type: String, default: 'Qalamekahani' },
    heroTitle: { type: String, default: 'Stories That Touch The Soul' },
    heroSubtitle: { type: String, default: 'Written & Narrated by Sabirkhan Pathan' },
    heroImage: { type: String, default: 'images/hero.png' },

    // Contact Info
    contactEmail: { type: String, default: 'sabirkhanp646@gmail.com' },
    contactPhone: { type: String, default: '+91 98765 43210' },
    contactAddress: { type: String, default: 'Mumbai, India' },

    // Social Links
    socialInstagram: { type: String, default: '#' },
    socialFacebook: { type: String, default: '#' },
    socialYoutube: { type: String, default: '#' },

    // Categories (Comma separated string or array)
    storyCategories: { type: [String], default: ['Horror', 'Romance', 'Mystery', 'Drama', 'Thriller'] },
    audioCategories: { type: [String], default: ['Audio Drama', 'Single Narration', 'Full Cast'] },
    bookCategories: { type: [String], default: ['Fiction', 'Non-Fiction', 'Anthology'] },
    blogCategories: { type: [String], default: ['Updates', 'Behind the Scenes', 'Tips'] },

    // About Section (Frontend)
    aboutHeading: { type: String, default: 'Welcome to My World of Words' },
    aboutShort: { type: String, default: 'Assalamualikum! I am Sabirkhan Pathan. Writing is not just my hobby, it\'s my way of connecting with souls. From spine-chilling horror to heart-touching romance, I weave emotions into words. Join me on this journey of imagination.' },
    aboutLong: { type: String, default: 'Sabir Khan is a renowned horror fiction writer known for his powerful storytelling in both Hindi and Gujarati languages. With a distinctive narrative voice and a deep understanding of fear psychology, his stories blur the line between the supernatural and reality.\n\nHis writing feels instinctive, raw, and intensely immersive—pulling readers into dark worlds they cannot easily escape.' },
    aboutImage: { type: String, default: 'images/author.png' }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
