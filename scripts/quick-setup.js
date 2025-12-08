/**
 * SIMPLE AUTO-SETUP - Downloads data and trains one stock at a time
 */

const yahooFinance = require('yahoo-finance2').default;
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
    console.log('\n🚀 Starting Auto-Setup...\n');

    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algo-trading';
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to database!\n');

        // Define schema
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

        const OHLCV = mongoose.models.OHLCV || mongoose.model('OHLCV', OHLCVSchema);

        // Download data for RELIANCE.NS as a test
        const symbol = 'RELIANCE.NS';
        console.log(`📥 Downloading 10 years of data for ${symbol}...`);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 10);

        const result = await yahooFinance.historical(symbol, {
            period1: startDate.toISOString().split('T')[0],
            period2: endDate.toISOString().split('T')[0],
            interval: '1d'
        });

        console.log(`✅ Downloaded ${result.length} days of data`);

        // Save to database
        console.log('💾 Saving to database...');
        let saved = 0;

        for (const candle of result) {
            await OHLCV.updateOne(
                { symbol, date: candle.date },
                {
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
                { upsert: true }
            );
            saved++;

            if (saved % 100 === 0) {
                console.log(`   Saved ${saved}/${result.length} records...`);
            }
        }

        console.log(`✅ Saved ${saved} records to database!`);
        console.log(`\n🎉 Setup complete for ${symbol}!`);
        console.log(`\nNext steps:`);
        console.log(`1. Go to http://localhost:3000/admin`);
        console.log(`2. Click "Training" in the sidebar`);
        console.log(`3. Enter "${symbol}" and click "Train Model"`);
        console.log(`4. Wait for training to complete`);
        console.log(`5. Go to Research Lab and search for "${symbol}"`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
