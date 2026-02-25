const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    targetId: {
        type: String,
        required: [true, 'Please add a target ID (Story/Book/Audio ID)']
    },
    targetType: {
        type: String,
        required: [true, 'Please add a target type'],
        enum: ['story', 'book', 'audio', 'blog']
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Please add a comment']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' // pending approval
    }
}, {
    timestamps: true
});

// Prevent multiple reviews from same user on same target?
// reviewSchema.index({ user: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
