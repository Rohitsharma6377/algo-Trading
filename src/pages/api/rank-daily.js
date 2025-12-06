
import { predictSymbol } from '../../lib/predictor';

// A default list of popular stocks to rank if none provided
const COMMON_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'AMD', 'NFLX'];

export default async function handler(req, res) {
    try {
        const inputStocks = req.body.stocks || COMMON_STOCKS;
        console.log(`Ranking stocks: ${inputStocks.join(', ')}`);

        const predictions = await Promise.all(
            inputStocks.map(async (sym) => {
                try {
                    return await predictSymbol(sym);
                } catch (e) {
                    console.error(`Prediction error for ${sym}:`, e);
                    return null;
                }
            })
        );

        // Filter out nulls, errors, and responses without probabilities (e.g. status messages)
        const validPredictions = predictions.filter(p =>
            p &&
            !p.error &&
            p.probabilities
        );

        console.log(`Found ${validPredictions.length} valid predictions.`);

        // Rank by 'UP' probability
        validPredictions.sort((a, b) => b.probabilities.up - a.probabilities.up);

        res.status(200).json({ ranked: validPredictions });
    } catch (error) {
        console.error('API /rank-daily Error:', error);
        res.status(500).json({ error: error.message });
    }
}
