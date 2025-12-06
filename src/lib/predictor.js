
import { loadModel, predict as predictTF } from './mlModel';
import { calculateIndicators } from './indicators';
import { extractFeatures } from './features';
import dbConnect from './db';
import OHLC from '../models/OHLC';

export const predictSymbol = async (symbol) => {
    await dbConnect();
    const cleanSym = symbol.toUpperCase();

    // 1. Load Model
    const model = await loadModel(cleanSym);
    // If no model, maybe trigger training or return null
    if (!model) return { status: 'No Model' };

    // 2. Fetch recent data
    // We need at least 250 candles to compute indicators properly (SMA200 etc)
    const data = await OHLC.find({ symbol: cleanSym }).sort({ date: 1 }).lean();
    if (data.length < 250) return { status: 'Insufficient Data' };

    // 3. Indicators
    const indicators = calculateIndicators(data);

    // 4. Extract Feature for LATEST candle
    const lastIdx = indicators.length - 1;
    const features = extractFeatures(data, indicators, lastIdx);

    if (!features) return { status: 'Feature Extraction Failed' };

    // 5. Predict
    // Probs: [UP, NEUTRAL, DOWN] based on labels [1,0,0], [0,1,0], [0,0,1] logic?
    // Wait, in features.js I did:
    // UP = [1, 0, 0]
    // NEUTRAL = [0, 1, 0]
    // DOWN = [0, 0, 1]

    // So distinct indices: 0=UP, 1=NEUTRAL, 2=DOWN. 
    // Is that correct?
    // In features.js:
    // if (change > THRESHOLD) label = [1, 0, 0]; (Index 0)
    // label = [0, 1, 0]; (Index 1)
    // if (change < -THRESHOLD) label = [0, 0, 1]; (Index 2)

    const probs = predictTF(model, features);
    // probs is [p_up, p_neutral, p_down]

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
