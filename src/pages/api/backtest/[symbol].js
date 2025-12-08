
import { runBacktest } from '../../../lib/backtester';
import dbConnect from '../../../lib/db';
import OHLCV from '../../../models/OHLCV'; // Fixed: Use correct model
import { fetchAndSaveStock } from '../../../lib/yahoo'; // Import fetcher

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { symbol } = req.query;
  const { initialCapital } = req.body;
  const cleanSym = symbol.toUpperCase();

  await dbConnect();

  // Fetch Data from DB
  let data = await OHLCV.find({ symbol: cleanSym }).sort({ date: 1 }).lean();

  // If insufficient data, try to fetch from external API (Yahoo)
  if (data.length < 200) {
    console.log(`[Backtest] Insufficient data for ${cleanSym}, attempting to fetch...`);
    try {
      await fetchAndSaveStock(cleanSym);
      // Query again
      data = await OHLCV.find({ symbol: cleanSym }).sort({ date: 1 }).lean();
    } catch (e) {
      console.error('[Backtest] Fetch failed:', e);
      return res.status(400).json({ error: `Failed to fetch data for ${cleanSym}. Please check symbol.` });
    }
  }

  if (data.length < 200) return res.status(400).json({ error: 'Insufficent Data (Need 200+ candles)' });

  // Load Model
  const { loadModel } = require('../../../lib/mlModel');
  const model = await loadModel(symbol.toUpperCase());

  if (!model) {
    // Fallback or warning?
    // Just run without model (Technical analysis only if fallback logic exists)
    // return res.status(404).json({ error: 'Model not trained for this symbol' });
    // Proceed but model is null
  }

  // Fetch Sentiment
  const NewsSentiment = require('../../../models/NewsSentiment');
  const sentimentDocs = await NewsSentiment.find({ symbol: symbol.toUpperCase() });
  const sentimentMap = {};
  sentimentDocs.forEach(doc => {
    sentimentMap[doc.date.toDateString()] = doc.sentimentScore;
  });

  const result = await runBacktest(
    symbol.toUpperCase(),
    data,
    initialCapital,
    model,
    sentimentMap // Pass sentiment
  );

  res.status(200).json(result);
}
