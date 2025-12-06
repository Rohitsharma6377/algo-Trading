
import { runStrategy } from '../../../lib/strategyEngine';
import { predictSymbol } from '../../../lib/predictor';
import { calculateIndicators } from '../../../lib/indicators';
import OHLC from '../../../models/OHLC';
import dbConnect from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { symbol, strategyName } = req.body;
    await dbConnect();

    const data = await OHLC.find({ symbol: symbol.toUpperCase() }).sort({ date: 1 }).lean();
    if (data.length === 0) return res.status(400).json({ error: 'No data' });

    const indicators = calculateIndicators(data);
    const lastRow = indicators[indicators.length - 1];

    const pred = await predictSymbol(symbol);

    const result = runStrategy(strategyName || 'ML_ENHANCED', lastRow, pred);

    res.status(200).json(result);
}
