const mongoose = require('mongoose');

const NewsSentimentSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        index: true,
        uppercase: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    title: String,
    sentimentScore: {
        type: Number,
        default: 0
    },
    source: String,
    link: String
}, {
    timestamps: true
});

// Compound index
NewsSentimentSchema.index({ symbol: 1, date: -1 });

module.exports = mongoose.models.NewsSentiment || mongoose.model('NewsSentiment', NewsSentimentSchema);
