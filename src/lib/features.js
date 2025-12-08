
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
 *   momentum_10,
 *   sentiment_score
 * ]
 */
export const extractFeatures = (data, indicators, index, sentimentScore = 0) => {
    // Current row in combined data (data should already have indicators merged conceptually,
    // but here we receive raw 'data' and 'indicators' array separately OR combined. 
    // Let's assume 'indicators' is the output of calculateIndicators which includes OHLC + Inds.

    // Safety check
    if (index < 50 || index >= indicators.length) return null; // Need history for 50

    const row = indicators[index];

    // If any required value is missing/null, return null to skip this sample
    if (row.sma20 == null || row.sma50 == null || row.rsi14 == null) return null;

    // Daily Return calculation if not present
    const prev = indicators[index - 1];
    const dailyReturn = prev ? (row.close - prev.close) / prev.close : 0;

    // MACD object structure from technicalindicators
    const m = row.macd || { MACD: 0, signal: 0, histogram: 0 };

    const features = [
        (row.close - row.sma20) / row.sma20,      // Dist from SMA20
        (row.close - row.sma50) / row.sma50,      // Dist from SMA50
        (row.rsi14 || 50) / 100,                  // Normalized RSI
        (row.atr14 || 0) / row.close,             // Normalized ATR
        m.MACD || 0,                              // MACD Line
        m.signal || 0,                            // MACD Signal
        m.histogram || 0,                         // MACD Hist
        dailyReturn || 0,                         // Daily Return
        row.volumeChange || 0,                    // Vol Change
        row.volatility5 || 0,                     // Volatility 5
        row.volatility20 || 0,                    // Volatility 20
        row.momentum10 || 0,                      // Mom 10
        sentimentScore                            // News Sentiment
    ];

    // Replace any NaNs with 0
    return features.map(f => (isNaN(f) || f === null || f === undefined) ? 0 : f);
};

export const createTrainingSet = (indicators, sentimentMap = {}, lookAhead = 1) => {
    const inputs = [];
    const outputs = [];
    const dates = [];

    const THRESHOLD = 0.0075; // 0.75%

    for (let i = 50; i < indicators.length - lookAhead; i++) {
        // Look up sentiment for this date. 
        // indicators[i].date is a Date object.
        const dateKey = indicators[i].date.toDateString();
        const score = sentimentMap[dateKey] || 0;

        const feats = extractFeatures(null, indicators, i, score);
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

export const normalizeFeatures = (features) => {
    if (!features || features.length === 0) return { normalized: [], scaler: {} };

    const numFeatures = features[0].length;
    const min = new Array(numFeatures).fill(Infinity);
    const max = new Array(numFeatures).fill(-Infinity);

    // Find min/max
    for (const row of features) {
        for (let i = 0; i < numFeatures; i++) {
            if (row[i] < min[i]) min[i] = row[i];
            if (row[i] > max[i]) max[i] = row[i];
        }
    }

    // Normalize
    const normalized = features.map(row => {
        return row.map((val, i) => {
            if (max[i] === min[i]) return 0;
            return (val - min[i]) / (max[i] - min[i]);
        });
    });

    return {
        normalized,
        scaler: { min, max }
    };
};
