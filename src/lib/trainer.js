
import dbConnect from './db';
import OHLCV from '../models/OHLCV';
import { calculateIndicators } from './indicators';
import { createTrainingSet } from './features';
import { trainModel as trainTF, saveModel } from './mlModel';

export const trainModel = async (symbol) => {
    await dbConnect();
    const cleanSym = symbol.toUpperCase();

    // 1. Fetch
    const data = await OHLCV.find({ symbol: cleanSym }).sort({ date: 1 }).lean();
    if (data.length < 200) throw new Error(`Not enough data for ${cleanSym}`);

    // 2. Indicators
    const indicators = calculateIndicators(data);

    // 3. Features
    const { inputs, outputs, dates } = createTrainingSet(indicators);

    if (inputs.length < 50) throw new Error("Not enough training samples");

    // 4. Train
    const { model, history } = await trainTF(inputs, outputs, { epochs: 50 });

    // 5. Save
    await saveModel(model, cleanSym);

    // Return stats
    const finalAcc = history.acc[history.acc.length - 1];
    return {
        symbol: cleanSym,
        accuracy: finalAcc,
        samples: inputs.length,
        version: Date.now()
    };
};
