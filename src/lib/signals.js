
/**
 * Signals Engine
 * Generates Buy/Sell signals based on ML + Rules
 */

export const generateSignal = (prediction, indicators) => {
    // Prediction: { prediction: 'UP'|'DOWN'|'NEUTRAL', confidence: 0.85, ... }
    // Indicators: Valid indicators object for the current/latest tick

    const { prediction: mlDir, confidence } = prediction;

    // Default
    let signal = 'HOLD';
    let reasoning = [];

    // 1. ML Filter
    const ML_THRESHOLD = 0.65;

    // 2. Momentum Filter
    // Confirm ML with Momentum (e.g., Mom10 > 0 for Buy)
    const momentum = indicators.momentum10;

    // 3. Volatility Filter
    // Avoid if volatility is extreme? Or use for banding.

    if (mlDir === 'UP' && confidence > ML_THRESHOLD) {
        if (momentum > 0) {
            signal = 'BUY';
            reasoning.push(`ML UP (${(confidence * 100).toFixed(0)}%) confirmed by Momentum`);
        } else {
            reasoning.push(`ML UP but Momentum negative - Wait`);
        }
    } else if (mlDir === 'DOWN') {
        // We can sell even with lower confidence if we want to protect capital, 
        // but let's stick to threshold or maybe lower for exit.
        if (confidence > 0.60) {
            signal = 'SELL';
            reasoning.push(`ML DOWN (${(confidence * 100).toFixed(0)}%)`);
        }
    }

    // 4. Stop Loss & Take Profit logic
    // ATR-based
    const atr = indicators.atr14 || 0;
    const price = indicators.close;

    let stopLoss = 0;
    let takeProfit = 0;

    if (signal === 'BUY') {
        stopLoss = price - (2 * atr);
        takeProfit = price + (4 * atr); // 1:2 Risk Reward
    } else if (signal === 'SELL') {
        stopLoss = price + (2 * atr);
        takeProfit = price - (4 * atr);
    }

    return {
        signal,
        stopLoss,
        takeProfit,
        reasoning: reasoning.join('; '),
        confidence,
        indicators: {
            atr,
            momentum
        }
    };
};
