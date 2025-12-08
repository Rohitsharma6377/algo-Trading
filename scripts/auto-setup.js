/**
 * AUTO-SETUP SCRIPT
 * Downloads historical data + news + trains ML model automatically
 */

const yahooFinance = require('yahoo-finance2').default;
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Import models and utilities
const dbConnect = require('../src/lib/db').default;
const { trainModel, saveModel } = require('../src/lib/mlModel');
const { calculateIndicators } = require('../src/lib/indicators');

// Define schemas inline if models aren't available
const OHLCVSchema = new mongoose.Schema({
    symbol: String,
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    adjClose: Number
});

const NewsSentimentSchema = new mongoose.Schema({
    symbol: String,
    date: Date,
    headline: String,
    source: String,
    url: String,
    sentimentScore: Number
});

const ModelMetaSchema = new mongoose.Schema({
    symbol: String,
    modelType: String,
    features: [String],
    trainingDate: Date,
    trainingDataRange: {
        start: Date,
        end: Date
    },
    metrics: {
        accuracy: Number,
        valAccuracy: Number,
        loss: Number,
        valLoss: Number
    },
    isActive: Boolean,
    modelPath: String
});

const OHLCV = mongoose.models.OHLCV || mongoose.model('OHLCV', OHLCVSchema);
const NewsSentiment = mongoose.models.NewsSentiment || mongoose.model('NewsSentiment', NewsSentimentSchema);
const ModelMeta = mongoose.models.ModelMeta || mongoose.model('ModelMeta', ModelMetaSchema);

// Popular Indian stocks to auto-setup
const STOCKS_TO_SETUP = [
    'RELIANCE.NS',
    'TCS.NS',
    'INFY.NS',
    'HDFCBANK.NS',
    'ICICIBANK.NS',
    'SBIN.NS',
    'TATASTEEL.NS',
    'TATAMOTORS.NS',
    'WIPRO.NS',
    'ITC.NS'
];

async function downloadHistoricalData(symbol) {
    console.log(`\n📥 Downloading 10 years of data for ${symbol}...`);

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 10); // 10 years back

        const result = await yahooFinance.historical(symbol, {
            period1: startDate.toISOString().split('T')[0],
            period2: endDate.toISOString().split('T')[0],
            interval: '1d'
        });

        console.log(`✅ Downloaded ${result.length} days of data`);

        // Save to database
        const bulkOps = result.map(candle => ({
            updateOne: {
                filter: { symbol, date: candle.date },
                update: {
                    $set: {
                        symbol,
                        date: candle.date,
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        volume: candle.volume,
                        adjClose: candle.adjClose || candle.close
                    }
                },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await OHLCV.bulkWrite(bulkOps);
            console.log(`💾 Saved ${bulkOps.length} records to database`);
        }

        return result.length;
    } catch (error) {
        console.error(`❌ Error downloading data for ${symbol}:`, error.message);
        return 0;
    }
}

async function downloadNews(symbol) {
    console.log(`\n📰 Fetching news for ${symbol}...`);

    try {
        const quote = await yahooFinance.quote(symbol);
        const companyName = quote.longName || quote.shortName || symbol.replace('.NS', '');

        // Simulate news sentiment (in production, use a real news API)
        const mockNews = [];
        const today = new Date();

        for (let i = 0; i < 100; i++) {
            const newsDate = new Date(today);
            newsDate.setDate(newsDate.getDate() - i);

            mockNews.push({
                symbol,
                date: newsDate,
                headline: `${companyName} market update - Day ${i}`,
                source: 'Market News',
                url: `https://example.com/news/${i}`,
                sentimentScore: (Math.random() - 0.5) * 2 // Random sentiment between -1 and 1
            });
        }

        // Save to database
        const bulkOps = mockNews.map(news => ({
            updateOne: {
                filter: { symbol, date: news.date },
                update: { $set: news },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await NewsSentiment.bulkWrite(bulkOps);
            console.log(`💾 Saved ${bulkOps.length} news items`);
        }

        return mockNews.length;
    } catch (error) {
        console.error(`❌ Error fetching news for ${symbol}:`, error.message);
        return 0;
    }
}

async function trainModelForSymbol(symbol) {
    console.log(`\n🤖 Training ML model for ${symbol}...`);

    try {
        // Fetch historical data
        const data = await OHLCV.find({ symbol }).sort({ date: 1 }).lean();

        if (data.length < 200) {
            console.log(`⚠️ Insufficient data (${data.length} days). Need at least 200 days.`);
            return false;
        }

        // Calculate indicators
        const indicators = calculateIndicators(data);

        // Prepare features and labels
        const features = [];
        const labels = [];

        for (let i = 20; i < data.length - 1; i++) {
            const current = data[i];
            const prev = data[i - 1];
            const next = data[i + 1];

            // Feature vector
            const featureVector = [
                (current.close - prev.close) / prev.close,
                current.volume / (data.slice(Math.max(0, i - 20), i).reduce((sum, d) => sum + d.volume, 0) / 20),
                indicators.rsi[i] / 100,
                indicators.macd[i] / current.close,
                indicators.macdSignal[i] / current.close,
                indicators.macdHistogram[i] / current.close,
                (current.close - indicators.bbLower[i]) / (indicators.bbUpper[i] - indicators.bbLower[i]),
                (current.close - indicators.sma20[i]) / indicators.sma20[i],
                (current.close - indicators.sma50[i]) / indicators.sma50[i],
                (indicators.sma20[i] - indicators.sma50[i]) / indicators.sma50[i],
                indicators.atr[i] / current.close,
                0 // Sentiment placeholder
            ];

            // Label (0=sell, 1=hold, 2=buy)
            const priceChange = (next.close - current.close) / current.close;
            let label;
            if (priceChange > 0.02) label = [0, 0, 1]; // Buy
            else if (priceChange < -0.02) label = [1, 0, 0]; // Sell
            else label = [0, 1, 0]; // Hold

            features.push(featureVector);
            labels.push(label);
        }

        console.log(`📊 Prepared ${features.length} training samples`);

        // Train the model
        const { model, metrics } = await trainModel(features, labels, {
            epochs: 50,
            batchSize: 32
        });

        // Save the model
        const { modelPath } = await saveModel(model, symbol);

        // Save metadata
        await ModelMeta.findOneAndUpdate(
            { symbol },
            {
                symbol,
                modelType: 'MLP',
                features: ['returns', 'volume_ratio', 'rsi', 'macd', 'macd_signal', 'macd_hist', 'bb_position', 'sma20_diff', 'sma50_diff', 'sma_cross', 'atr', 'sentiment'],
                trainingDate: new Date(),
                trainingDataRange: {
                    start: data[0].date,
                    end: data[data.length - 1].date
                },
                metrics,
                isActive: true,
                modelPath
            },
            { upsert: true }
        );

        console.log(`✅ Model trained successfully!`);
        console.log(`   Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
        console.log(`   Val Accuracy: ${(metrics.valAccuracy * 100).toFixed(2)}%`);

        return true;
    } catch (error) {
        console.error(`❌ Error training model for ${symbol}:`, error.message);
        return false;
    }
}

async function setupStock(symbol) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 SETTING UP: ${symbol}`);
    console.log(`${'='.repeat(60)}`);

    try {
        // Step 1: Download historical data
        const dataCount = await downloadHistoricalData(symbol);
        if (dataCount < 200) {
            console.log(`⚠️ Skipping ${symbol} - insufficient data`);
            return false;
        }

        // Step 2: Download news
        await downloadNews(symbol);

        // Step 3: Train model
        const trained = await trainModelForSymbol(symbol);

        if (trained) {
            console.log(`\n✅ ${symbol} is ready for AI analysis!`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ Failed to setup ${symbol}:`, error.message);
        return false;
    }
}

async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🤖 ALGO-TRADING AI AUTO-SETUP                          ║
║                                                           ║
║   This will:                                              ║
║   1. Download 10 years of historical data                ║
║   2. Fetch news sentiment data                           ║
║   3. Train ML models for each stock                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    try {
        // Connect to database
        console.log('\n📡 Connecting to database...');
        await dbConnect();
        console.log('✅ Database connected!');

        // Setup each stock
        const results = [];
        for (const symbol of STOCKS_TO_SETUP) {
            const success = await setupStock(symbol);
            results.push({ symbol, success });

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Summary
        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 SETUP SUMMARY');
        console.log(`${'='.repeat(60)}`);

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`\n✅ Successfully setup: ${successful.length}/${results.length} stocks`);
        if (successful.length > 0) {
            console.log('   ' + successful.map(r => r.symbol).join(', '));
        }

        if (failed.length > 0) {
            console.log(`\n❌ Failed: ${failed.length} stocks`);
            console.log('   ' + failed.map(r => r.symbol).join(', '));
        }

        console.log(`\n🎉 Setup complete! You can now use the Research Lab to analyze stocks.`);
        console.log(`   Go to: http://localhost:3000/admin/research`);

    } catch (error) {
        console.error('\n❌ Setup failed:', error);
    } finally {
        process.exit(0);
    }
}

// Run the setup
main();
