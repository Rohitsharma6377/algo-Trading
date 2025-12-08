
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { runBacktest } from '../src/lib/backtester.js';
import OHLCV from '../src/models/OHLCV.js';
import { fetchAndSaveStock } from '../src/lib/yahoo.js';
import { loadModel } from '../src/lib/mlModel.js';
import NewsSentiment from '../src/models/NewsSentiment.js';

dotenv.config();

async function testVideo() {
    console.log("🚀 Testing Backtest Logic for BTC-USD...");

    // Connect DB
    if (!process.env.MONGODB_URI) throw new Error("No Mongo URI");
    await mongoose.connect(process.env.MONGODB_URI);

    const symbol = 'BTC-USD';

    // 1. Check Data
    // Note: Mongoose models might need to be imported differently if they rely on CJS internally or side-effects.
    // But usually in this project they seem to be mixed. Let's try.

    let data = await OHLCV.find({ symbol }).sort({ date: 1 }).lean();
    console.log(`Found ${data.length} records for ${symbol}`);

    if (data.length < 200) {
        console.log("Fetching new data from Yahoo...");
        await fetchAndSaveStock(symbol);
        data = await OHLCV.find({ symbol }).sort({ date: 1 }).lean();
        console.log(`Now have ${data.length} records.`);
    }

    if (data.length < 200) {
        console.error("Still insufficient data.");
        process.exit(1);
    }

    // 2. Load Model
    console.log("Loading Model...");
    const model = await loadModel(symbol);
    if (!model) console.log("⚠️ No model found (will run tech-only backtest if allowed)");

    // 3. Load Sentiment
    console.log("Loading Sentiment...");
    const sentimentDocs = await NewsSentiment.find({ symbol });
    const sentimentMap = {};
    sentimentDocs.forEach(doc => sentimentMap[doc.date.toDateString()] = doc.sentimentScore);
    console.log(`Loaded ${sentimentDocs.length} sentiment records.`);

    // 4. Run Backtest
    console.log("Running Sim...");
    const result = await runBacktest(symbol, data, 100000, model, sentimentMap);

    console.log("✅ Backtest Result:");
    console.log(`Total Return: ${result.totalReturn.toFixed(2)}%`);
    console.log(`Final Equity: $${result.finalEquity.toFixed(2)}`);
    console.log(`Trades: ${result.trades.length}`);

    await mongoose.connection.close();
    process.exit(0);
}

testVideo().catch(e => {
    console.error(e);
    process.exit(1);
});
