
import { generateSignal } from './signals';

/**
 * Strategy Engine
 * Executes various strategies and returns standardized signals
 */

export const runStrategy = (strategyName, marketData, predictionModel) => {
    // marketData: { close, high, low, open, volume, indicators... }
    // predictionModel: result from predictor.js

    const strategies = {
        'ML_ENHANCED': runMLEnhanced,
        'TREND_FOLLOWING': runTrendFollowing,
        'BREAKOUT': runBreakout,
        'SWING': runSwing
    };

    const strategy = strategies[strategyName];
    if (!strategy) throw new Error(`Unknown Strategy: ${strategyName}`);

    return strategy(marketData, predictionModel);
};

// 1. ML Enhanced Strategy
const runMLEnhanced = (data, prediction) => {
    // Use the signals.js logic
    const signalResult = generateSignal(prediction, data);
    return {
        strategy: 'ML_ENHANCED',
        ...signalResult
    };
};

// 2. Trend Following (EMA20 > EMA50)
const runTrendFollowing = (data) => {
    const { ema20, ema50, close } = data;
    let signal = 'HOLD';
    let reasoning = 'No clear trend';

    if (ema20 > ema50) {
        // Uptrend
        if (close > ema20) {
            signal = 'BUY';
            reasoning = 'Uptrend (EMA20 > EMA50) & Price > EMA20';
        }
    } else if (ema20 < ema50) {
        // Downtrend
        if (close < ema20) {
            signal = 'SELL';
            reasoning = 'Downtrend (EMA20 < EMA50) & Price < EMA20';
        }
    }

    return { strategy: 'TREND_FOLLOWING', signal, reasoning };
};

// 3. Breakout (Bollinger)
const runBreakout = (data) => {
    const { close, bbUpper, bbLower } = data;
    let signal = 'HOLD';
    let reasoning = 'Within bands';

    if (close > bbUpper) {
        signal = 'BUY';
        reasoning = 'Upper BB Breakout';
    } else if (close < bbLower) {
        signal = 'SELL';
        reasoning = 'Lower BB Breakdown';
    }

    return { strategy: 'BREAKOUT', signal, reasoning };
};

// 4. Swing (RSI + MACD)
const runSwing = (data) => {
    const { rsi14, macd } = data;
    let signal = 'HOLD';
    let reasoning = 'Wait for setup';

    // Oversold + MACD Bullish Crossover (Simplified check, ideally check previous candle)
    if (rsi14 < 30 && macd.histogram > 0) {
        signal = 'BUY';
        reasoning = 'Oversold (RSI < 30) + Positive Momentum';
    }
    // Overbought + MACD Bearish
    else if (rsi14 > 70 && macd.histogram < 0) {
        signal = 'SELL';
        reasoning = 'Overbought (RSI > 70) + Negative Momentum';
    }

    return { strategy: 'SWING', signal, reasoning };
};
