
import { loadModel, predict as predictTF } from './mlModel';
import { calculateIndicators } from './indicators';
import { extractFeatures } from './features';
import dbConnect from './db';
import OHLC from '../models/OHLCV';

import NewsSentiment from '../models/NewsSentiment';

export const predictSymbol = async (symbol) => {
    await dbConnect();
    const cleanSym = symbol.toUpperCase();

    // 1. Load Model
    const model = await loadModel(cleanSym);
    // If no model, maybe trigger training or return null
    if (!model) return { status: 'No Model' };

    // 2. Fetch recent data (Optimized)
    // We fetch reverse chronological to get latest, but need proper order for calculation
    // Limit to 500 candles to prevent memory/CPU spikes
    const recentData = await OHLC.find({ symbol: cleanSym })
        .sort({ date: -1 })
        .limit(500)
        .lean();

    if (recentData.length < 250) return { status: 'Insufficient Data' };

    // Sort back to chronological order (oldest -> newest) for indicator calc
    const data = recentData.reverse();

    // 3. Indicators
    const indicators = calculateIndicators(data);

    // 4. Fetch Latest Sentiment & Extract Feature
    // Look for sentiment in the last 48 hours to be relevant
    const recentSentiment = await NewsSentiment.findOne({
        symbol: cleanSym,
        date: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
    }).sort({ date: -1 });

    const sentimentScore = recentSentiment?.sentimentScore || 0;

    // Pass sentiment to feature extraction
    const lastIdx = indicators.length - 1;
    const features = extractFeatures(data, indicators, lastIdx, sentimentScore);

    if (!features) return { status: 'Feature Extraction Failed' };

    // 5. Predict
    // Now async to prevent blocking
    const probs = await predictTF(model, features);

    const [pUp, pNeutral, pDown] = probs;

    let prediction = 'NEUTRAL';
    let confidence = pNeutral;

    if (pUp > pNeutral && pUp > pDown) {
        prediction = 'UP';
        confidence = pUp;
    } else if (pDown > pUp && pDown > pNeutral) {
        prediction = 'DOWN';
        confidence = pDown;
    }

    return {
        symbol: cleanSym,
        probabilities: {
            up: pUp,
            neutral: pNeutral,
            down: pDown
        },
        prediction,
        confidence,
        suggestedBuyWindow: prediction === 'UP' ? 'IMMEDIATE' : 'WAIT',
        suggestedSellWindow: prediction === 'DOWN' ? 'IMMEDIATE' : 'HOLD',
        timestamp: new Date().toISOString()
    };
};
