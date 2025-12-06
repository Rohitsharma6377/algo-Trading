
import React, { useState } from 'react';

export default function StrategyPanel({ symbol, onRunStrategy }) {
    const [selected, setSelected] = useState('ML_ENHANCED');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const strategies = [
        { id: 'ML_ENHANCED', name: 'ML Enhanced' },
        { id: 'TREND_FOLLOWING', name: 'Trend Following' },
        { id: 'BREAKOUT', name: 'BB Breakout' },
        { id: 'SWING', name: 'RSI Swing' }
    ];

    const handleRun = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/strategy/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, strategyName: selected })
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-4 rounded-xl border border-white/10">
            <h3 className="text-purple-400 font-bold font-mono text-sm mb-4">STRATEGY_ENGINE</h3>

            <div className="flex space-x-2 mb-4 overflow-x-auto">
                {strategies.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setSelected(s.id)}
                        className={`px-3 py-1 rounded text-xs font-mono border whitespace-nowrap transition ${selected === s.id
                                ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                : 'border-gray-700 text-gray-500 hover:border-gray-500'
                            }`}
                    >
                        {s.name}
                    </button>
                ))}
            </div>

            <button
                onClick={handleRun}
                disabled={loading}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-mono font-bold tracking-widest mb-4 transition"
            >
                {loading ? 'EXECUTING...' : 'RUN_STRATEGY'}
            </button>

            {result && (
                <div className="bg-black/40 p-3 rounded border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 text-xs text-[10px] uppercase">Signal</span>
                        <span className={`font-bold font-mono ${result.signal === 'BUY' ? 'text-green-500' : result.signal === 'SELL' ? 'text-red-500' : 'text-gray-400'}`}>
                            {result.signal}
                        </span>
                    </div>
                    {result.confidence && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500 text-xs text-[10px] uppercase">Confidence</span>
                            <span className="text-white font-mono text-xs">{(result.confidence * 100).toFixed(0)}%</span>
                        </div>
                    )}
                    <p className="text-[10px] text-gray-400 font-mono mt-2 border-t border-white/5 pt-2">
                        {result.reasoning}
                    </p>
                </div>
            )}
        </div>
    );
}
