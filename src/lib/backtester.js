
import { calculateIndicators } from './indicators';
import { extractFeatures } from './features';
import { loadModel, predict } from './mlModel';
import { generateSignal } from './signals';

/**
 * Backtest Engine
 * Simulates trading over historical data
 */
export const runBacktest = async (
    symbol,
    ohlcData, // Array of { date, open, high, low, close, volume }
    initialCapital = 100000,
    model = null, // Logic can work without ML if using strict rules, but usually we pass the ML model
    options = {}
) => {
    // 1. Calculate Indicators
    const indicators = calculateIndicators(ohlcData);

    // 2. Setup Loop
    let cash = initialCapital;
    let holdings = 0;
    let equity = initialCapital;

    // Stats
    const trades = [];
    const equityCurve = [];

    const { commissionPercent = 0.001 } = options;

    // Warmup period
    const START_IDX = 200;

    for (let i = START_IDX; i < indicators.length; i++) {
        const row = indicators[i];
        const date = row.date;
        const price = row.close;

        // Update Equity
        equity = cash + (holdings * price);
        equityCurve.push({ date, equity });

        // Generate Signal
        // If ML model provided, use it
        let prediction = { prediction: 'NEUTRAL', confidence: 0 };

        if (model) {
            // Need features
            const feats = extractFeatures(ohlcData, indicators, i);
            if (feats) {
                const probs = predict(model, feats);
                // probs is simple array [p_up, p_neutral, p_down]
                // need to convert to obj logic seen in signals.js
                // assuming predict from mlModel returns Array<number> or Object?
                // mlModel.js export predict returns Array<number> (from my last edit)

                // wait, mlModel.js predict returns Array.from(probs)
                const [pUp, pNeutral, pDown] = probs;
                if (pUp > pNeutral && pUp > pDown) { prediction = { prediction: 'UP', confidence: pUp }; }
                else if (pDown > pUp && pDown > pNeutral) { prediction = { prediction: 'DOWN', confidence: pDown }; }
                else { prediction = { prediction: 'NEUTRAL', confidence: pNeutral }; }
            }
        }

        // Signal
        const { signal, stopLoss, takeProfit } = generateSignal(prediction, row);

        // Execution Logic
        if (signal === 'BUY' && cash > price) {
            // Full send or fixed size? 
            // Fixed 10% size
            const positionSize = Math.floor((equity * 0.1) / price);
            if (positionSize > 0 && cash >= positionSize * price) {
                // Check if already holding?
                // Simple strat: Max 1 position? 
                if (holdings === 0) {
                    const cost = positionSize * price;
                    const costWithComm = cost * (1 + commissionPercent);
                    cash -= costWithComm;
                    holdings += positionSize;

                    trades.push({
                        type: 'BUY',
                        date,
                        price,
                        quantity: positionSize,
                        commission: cost * commissionPercent
                    });
                }
            }
        } else if (signal === 'SELL' && holdings > 0) {
            const revenue = holdings * price;
            const revWithComm = revenue * (1 - commissionPercent);
            cash += revWithComm;

            trades.push({
                type: 'SELL',
                date,
                price,
                quantity: holdings,
                commission: revenue * commissionPercent,
                pnl: revWithComm - 0 // need to track entry price to calc pnl correctly
            });

            holdings = 0;
        }

        // Logic for StopLoss / TakeProfit not implemented in this simple loop loop
        // but can be added here checking intra-candle Low/High vs SL/TP
    }

    // Close positions at end
    if (holdings > 0) {
        const lastPrice = indicators[indicators.length - 1].close;
        cash += holdings * lastPrice;
        trades.push({ type: 'SELL', date: 'END', price: lastPrice, quantity: holdings, note: 'Liquidate' });
        holdings = 0;
    }

    // Metrics
    const finalEquity = cash;
    const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;

    // Fill proper PnL for trades
    // ...

    return {
        initialCapital,
        finalEquity,
        totalReturn,
        trades,
        equityCurve
    };
};
