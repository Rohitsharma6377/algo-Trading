/**
 * Fetch News & Analyze Sentiment Script
 * Usage: node scripts/fetchNews.js SYMBOL
 */

require('dotenv').config();
const mongoose = require('mongoose');
const yahooFinance = require('yahoo-finance2').default;
const NewsSentiment = require('../src/models/NewsSentiment');

// Simple sentiment dictionary (AFINN-165 inspired subset)
const sentimentDict = {
    'breakthrough': 3, 'growth': 2, 'record': 2, 'up': 1, 'rise': 1, 'bull': 2, 'positive': 2,
    'beat': 2, 'profit': 2, 'gain': 2, 'high': 1, 'surge': 3, 'jump': 2, 'buy': 2,
    'strong': 2, 'success': 2, 'partnership': 1, 'launch': 1, 'win': 2, 'award': 1,
    'down': -1, 'fall': -1, 'drop': -1, 'bear': -2, 'negative': -2, 'loss': -2,
    'miss': -2, 'fail': -2, 'weak': -2, 'crash': -3, 'decline': -1, 'sell': -2,
    'plunge': -3, 'concern': -1, 'risk': -1, 'lawsuit': -2, 'ban': -2, 'debt': -1,
    'crisis': -3, 'inflation': -1, 'recession': -2, 'warning': -1
};

function analyzeSentiment(text) {
    if (!text) return 0;
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    let count = 0;
    words.forEach(w => {
        if (sentimentDict[w]) {
            score += sentimentDict[w];
            count++;
        }
    });
    // Normalize roughly between -1 and 1
    if (count === 0) return 0;
    return Math.max(-1, Math.min(1, score / Math.max(1, count)));
}

async function fetchNews(symbol) {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) throw new Error('MONGODB_URI not defined');

        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);

        console.log(`📰 Fetching news for ${symbol}...`);

        // Yahoo Finance Search often returns news mixed with quotes
        // We use 'search' to find news items related to the ticker
        const result = await yahooFinance.search(symbol, { newsCount: 10 });

        if (!result.news || result.news.length === 0) {
            console.log('No recent news found.');
            process.exit(0);
        }

        console.log(`Found ${result.news.length} news items.`);

        let inserted = 0;
        for (const item of result.news) {
            const date = new Date(item.providerPublishTime * 1000); // Yahoo often provides epoch
            const score = analyzeSentiment(item.title);

            // Upsert
            await NewsSentiment.findOneAndUpdate(
                { symbol: symbol.toUpperCase(), date: date },
                {
                    title: item.title,
                    link: item.link,
                    source: item.publisher,
                    sentimentScore: score
                },
                { upsert: true, new: true }
            );
            inserted++;
            console.log(`  [${score.toFixed(2)}] ${item.title.substring(0, 50)}...`);
        }

        console.log(`✅ Processed ${inserted} news items.`);
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fetching news:', error);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
const symbol = args[0];

if (!symbol) {
    console.error('Usage: node scripts/fetchNews.js SYMBOL');
    process.exit(1);
}

fetchNews(symbol);
