/**
 * Fetch historical data script
 * Usage: node scripts/fetchData.js SYMBOL [START_DATE] [END_DATE]
 * Example: node scripts/fetchData.js RELIANCE.NS 2022-01-01 2024-01-01
 */

require('dotenv').config();
const mongoose = require('mongoose');
const yahooFinance = require('yahoo-finance2').default;
const OHLCV = require('../src/models/OHLCV');

async function fetchData(symbol, startDate, endDate) {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not defined in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

    console.log(`📥 Fetching data for ${symbol} from ${start.toDateString()} to ${end.toDateString()}...`);

    const result = await yahooFinance.historical(symbol, {
      period1: start,
      period2: end,
      interval: '1d',
    });

    if (!result || result.length === 0) {
      console.log('❌ No data found');
      process.exit(1);
    }

    console.log(`📊 Received ${result.length} data points`);

    let inserted = 0;
    let updated = 0;

    for (const candle of result) {
      const existing = await OHLCV.findOne({
        symbol: symbol.toUpperCase(),
        date: candle.date,
      });

      if (existing) {
        await OHLCV.updateOne(
          { _id: existing._id },
          {
            $set: {
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
              adjClose: candle.adjClose,
            },
          }
        );
        updated++;
      } else {
        await OHLCV.create({
          symbol: symbol.toUpperCase(),
          date: candle.date,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          adjClose: candle.adjClose,
        });
        inserted++;
      }
    }

    console.log(`✅ Data stored: ${inserted} new, ${updated} updated`);

    // Trigger News Fetch
    console.log('📰 Triggering News Fetch...');
    const { exec } = require('child_process');
    exec(`node scripts/fetchNews.js ${symbol}`, (error, stdout, stderr) => {
      if (error) console.error(`News fetch error: ${error.message}`);
      if (stderr) console.error(`News fetch stderr: ${stderr}`);
      if (stdout) console.log(stdout); // Log news fetch output
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const symbol = args[0];
const startDate = args[1];
const endDate = args[2];

if (!symbol) {
  console.error('❌ Usage: node scripts/fetchData.js SYMBOL [START_DATE] [END_DATE]');
  console.error('Example: node scripts/fetchData.js RELIANCE.NS 2022-01-01 2024-01-01');
  process.exit(1);
}

fetchData(symbol, startDate, endDate);
