
import React from 'react';
import ChartSparkline from './ChartSparkline';

const StockCard = ({ prediction, symbol }) => {
    if (!prediction) {
        return (
            <div className="glass-panel rounded-xl p-6 relative overflow-hidden animate-pulse min-h-[220px]">
                <div className="h-6 bg-gray-800/50 rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-gray-800/50 rounded w-1/2"></div>
            </div>
        );
    }

    const { currentPrice, probabilities, reliability, date, suggestedBuyWindow, prediction: predSignal } = prediction;
    const isUp = predSignal === 'UP';
    const isDown = predSignal === 'DOWN';

    // Dynamic glow based on signal
    const glowColor = isUp ? 'shadow-[0_0_20px_rgba(10,255,0,0.2)] border-neon-green/30' :
        isDown ? 'shadow-[0_0_20px_rgba(255,0,0,0.2)] border-red-500/30' :
            'shadow-[0_0_20px_rgba(0,243,255,0.1)] border-neon-blue/30';

    const textColor = isUp ? 'text-neon-green drop-shadow-[0_0_5px_rgba(10,255,0,0.5)]' :
        isDown ? 'text-red-500 drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]' :
            'text-gray-400';

    return (
        <div className={`glass-panel ${glowColor} rounded-xl p-6 relative group transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1`}>
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 rounded-br-lg"></div>

            <div className="flex justify-between items-start mb-4 z-10 relative">
                <div>
                    <h3 className="text-3xl font-mono font-bold text-white tracking-tighter">{symbol}</h3>
                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">{new Date(date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-white">${currentPrice?.toFixed(2)}</p>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full bg-black/40 border border-white/10 uppercase tracking-widest mt-2 inline-block ${textColor}`}>
                        {predSignal}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 font-mono text-xs">
                <div className="bg-black/20 p-2 rounded border border-white/5">
                    <p className="text-gray-500 uppercase mb-1">AI Confidence</p>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${isUp ? 'bg-neon-green' : isDown ? 'bg-red-500' : 'bg-neon-blue'}`}
                            style={{ width: `${reliability * 100}%` }}
                        />
                    </div>
                    <p className="text-white mt-1 text-right">{(reliability * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-black/20 p-2 rounded border border-white/5">
                    <p className="text-gray-500 uppercase mb-1">Signal Dist.</p>
                    <div className="flex justify-between items-center h-full">
                        <span className="text-neon-green">↑{(probabilities.up * 100).toFixed(0)}</span>
                        <span className="text-gray-400">={(probabilities.neutral * 100).toFixed(0)}</span>
                        <span className="text-red-500">↓{(probabilities.down * 100).toFixed(0)}</span>
                    </div>
                </div>
            </div>

            {suggestedBuyWindow && (
                <div className="mb-4 bg-neon-green/10 border border-neon-green/20 p-2 rounded flex items-center justify-between">
                    <span className="text-[10px] text-neon-green font-bold uppercase tracking-wider">Target Window</span>
                    <span className="text-xs text-white font-mono">
                        {new Date(suggestedBuyWindow.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )}

            {/* Sparkline Container with glow */}
            <div className="h-20 w-full mt-2 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50 z-0 pointer-events-none"></div>
                <ChartSparkline isUp={isUp} />
            </div>
        </div>
    );
};

export default StockCard;
