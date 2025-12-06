
import dbConnect from '../../../lib/db';
import { calculateIndicators } from '../../../lib/indicators';
import { extractFeatures } from '../../../lib/features';
import { loadModel, predict } from '../../../lib/mlModel';
import { generateSignal } from '../../../lib/signals';
import OHLC from '../../../models/OHLC';
import { getLatestPrice } from '../../../lib/yahoo';

export default async function handler(req, res) {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol needed' });

    await dbConnect();
    const cleanSym = symbol.toUpperCase();

    // Get Data
    const data = await OHLC.find({ symbol: cleanSym }).sort({ date: 1 }).lean();
    if (data.length < 200) return res.status(400).json({ error: 'Not enough data' });

    // Indicators
    const indicators = calculateIndicators(data);
    const lastRow = indicators[indicators.length - 1];

    // ML
    const model = await loadModel(cleanSym);
    let prediction = { prediction: 'NEUTRAL', confidence: 0 };
    if (model) {
        const feats = extractFeatures(data, indicators, indicators.length - 1);
        if (feats) {
            const probs = predict(model, feats);
            // Conversion logic same as predictor.js
            const [pUp, pNeutral, pDown] = probs;
            if (pUp > pNeutral && pUp > pDown) prediction = { prediction: 'UP', confidence: pUp };
            if (pDown > pUp && pDown > pNeutral) prediction = { prediction: 'DOWN', confidence: pDown };
        }
    }

    const signal = generateSignal(prediction, lastRow);

    res.status(200).json({
        symbol: cleanSym,
        price: lastRow.close,
        prediction,
        signal
    });
}
