
import React from 'react';

const IndicatorItem = ({ label, value, color = 'text-white' }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
        <span className="text-gray-400 text-xs font-mono uppercase">{label}</span>
        <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
    </div>
);

export default function IndicatorPanel({ indicators }) {
    if (!indicators) return <div className="p-4 text-gray-500 font-mono text-xs">NO DATA</div>;

    const { rsi14, macd, bbUpper, bbLower, sma20, sma50, atr14 } = indicators;

    // Derived states
    const trend = sma20 > sma50 ? 'BULLISH' : 'BEARISH';
    const vol = (bbUpper - bbLower).toFixed(2);

    return (
        <div className="glass-panel p-4 rounded-xl border border-white/10">
            <h3 className="text-neon-blue font-bold font-mono text-sm mb-4 flex items-center">
                <span className="w-2 h-2 bg-neon-blue rounded-full mr-2 animate-pulse"></span>
                TECHNICAL_METRICS
            </h3>

            <div className="space-y-1">
                <IndicatorItem label="Trend (SMA20/50)" value={trend} color={trend === 'BULLISH' ? 'text-green-400' : 'text-red-400'} />
                <IndicatorItem label="RSI (14)" value={rsi14?.toFixed(2)} color={rsi14 > 70 ? 'text-red-400' : rsi14 < 30 ? 'text-green-400' : 'text-white'} />
                <IndicatorItem label="MACD" value={macd?.MACD?.toFixed(2)} />
                <IndicatorItem label="Signal" value={macd?.signal?.toFixed(2)} />
                <IndicatorItem label="ATR (Volatility)" value={atr14?.toFixed(2)} />
                <IndicatorItem label="Bollinger Width" value={vol} />
            </div>
        </div>
    );
}
