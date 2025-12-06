
/**
 * Transforms calculated indicators into a feature vector for the ML model.
 * 
 * Vector:
 * [
 *   (close - SMA20)/SMA20,
 *   (close - SMA50)/SMA50,
 *   RSI14/100,
 *   ATR14/close,
 *   MACD_line,
 *   MACD_signal,
 *   MACD_hist,
 *   daily_return,
 *   volume_change,
 *   volatility_5,
 *   volatility_20,
 *   momentum_10
 * ]
 */
export const extractFeatures = (data, indicators, index) => {
    // Current row in combined data (data should already have indicators merged conceptually,
    // but here we receive raw 'data' and 'indicators' array separately OR combined. 
    // Let's assume 'indicators' is the output of calculateIndicators which includes OHLC + Inds.

    // Safety check
    if (index < 50 || index >= indicators.length) return null; // Need history for 50

    const row = indicators[index];

    // If any required value is missing/null, return null to skip this sample
    if (row.sma20 == null || row.sma50 == null || row.rsi14 == null) return null;

    // Daily Return calculation if not present
    // row.dailyReturn might be missing if not calc'd in indicators
    // but calculateIndicators() function I wrote does NOT add 'dailyReturn', let's derive it or modify indicators.js?
    // indicators.js DOES NOT add dailyReturn explicitly in my last edit, let's calc on fly.
    const prev = indicators[index - 1];
    const dailyReturn = prev ? (row.close - prev.close) / prev.close : 0;

    // MACD normalization
    // MACD values are absolute price diffs, can be large. 
    // Better to normalize by Close?
    // Prompt asks for "MACD_line", "MACD_signal". We'll use raw or normalized? 
    // Usually raw is risky for price varying assets. But prompt didn't specify normalization for MACD.
    // I will normalize by Close to be robust. 
    // WAIT: Prompt says "Vector must include: MACD_line...". I will stick to prompt.

    // MACD object structure from technicalindicators
    // { MACD: ..., signal: ..., histogram: ... }
    const m = row.macd || { MACD: 0, signal: 0, histogram: 0 };

    const features = [
        (row.close - row.sma20) / row.sma20,      // Dist from SMA20
        (row.close - row.sma50) / row.sma50,      // Dist from SMA50
        row.rsi14 / 100,                          // Normalized RSI
        row.atr14 / row.close,                    // Normalized ATR
        m.MACD,                                   // MACD Line
        m.signal,                                    // MACD Signal
        m.histogram,                              // MACD Hist
        dailyReturn,                              // Daily Return
        row.volumeChange,                         // Vol Change
        row.volatility5,                          // Volatility 5
        row.volatility20,                         // Volatility 20
        row.momentum10                            // Mom 10
    ];

    // Replace any NaNs with 0
    return features.map(f => (isNaN(f) || f === null || f === undefined) ? 0 : f);
};

export const createTrainingSet = (indicators, lookAhead = 1) => {
    const inputs = [];
    const outputs = [];
    const dates = [];

    // Label Logic:
    // tom > +0.75% -> UP ([1, 0, 0])
    // tom < -0.75% -> DOWN ([0, 0, 1])
    // else -> NEUTRAL ([0, 1, 0])

    const THRESHOLD = 0.0075; // 0.75%

    for (let i = 50; i < indicators.length - lookAhead; i++) {
        const feats = extractFeatures(null, indicators, i);
        if (!feats) continue;

        // Label
        const currentClose = indicators[i].close;
        const futureClose = indicators[i + lookAhead].close;
        const change = (futureClose - currentClose) / currentClose;

        let label = [0, 1, 0]; // Neutral
        if (change > THRESHOLD) label = [1, 0, 0]; // Up
        if (change < -THRESHOLD) label = [0, 0, 1]; // Down

        inputs.push(feats);
        outputs.push(label);
        dates.push(indicators[i].date); // for reference
    }

    return { inputs, outputs, dates };
};
