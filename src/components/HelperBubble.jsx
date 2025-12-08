
import React, { useState, useEffect } from 'react';
import useStockStore from '../store/useStockStore';

const HelperBubble = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { rankedStocks, fetchRankedStocks, isLoadingRankings } = useStockStore();

    useEffect(() => {
        if (!isLoadingRankings && rankedStocks.length === 0) {
            fetchRankedStocks();
        }
        // Removed automatic interval to prevent server overload
    }, []);

    const topStock = rankedStocks.length > 0 ? rankedStocks[0] : null;

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">

            {/* Expanded Holographic Panel */}
            {isOpen && (
                <div className="mb-6 glass-panel border-neon-blue/40 rounded-xl p-0 w-80 animate-fade-in-up overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 p-3 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                            <h4 className="font-mono font-bold text-sm text-neon-blue tracking-widest uppercase">
                                CORTEX AI
                            </h4>
                        </div>
                        <button onClick={() => fetchRankedStocks()} className="text-xs text-gray-400 hover:text-white transition">
                            ⚡ REFRESH
                        </button>
                    </div>

                    <div className="p-5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">System Top Pick</p>

                        {topStock ? (
                            <div className="text-center relative">
                                {/* Decorative circle */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-neon-blue/10 rounded-full blur-xl"></div>

                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 font-sans mb-1 relative z-10">
                                    {topStock.symbol}
                                </div>
                                <div className="inline-block px-3 py-1 rounded bg-neon-green/10 border border-neon-green/30 text-neon-green font-bold text-xs tracking-wider mb-4 relative z-10">
                                    {topStock.prediction} SIGNAL
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-left bg-black/40 p-3 rounded-lg border border-white/5 relative z-10">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Confidence</p>
                                        <p className="text-neon-blue font-mono">
                                            {((topStock.confidence || topStock.reliability || 0) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Window</p>
                                        <p className="text-white font-mono text-xs">
                                            {typeof topStock.suggestedBuyWindow === 'string'
                                                ? topStock.suggestedBuyWindow
                                                : (topStock.suggestedBuyWindow?.start
                                                    ? new Date(topStock.suggestedBuyWindow.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'N/A')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="spinner border-neon-blue mx-auto mb-2"></div>
                                <p className="text-xs text-neon-blue animate-pulse">Running analysis...</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-black/40 p-2 text-center border-t border-white/5">
                        <p className="text-[9px] text-gray-600 font-mono">
                            AI GENERATED • NOT FINANCIAL ADVICE • v1.0
                        </p>
                    </div>
                </div>
            )}

            {/* Floating Orb Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-16 w-16 rounded-full bg-black/80 border border-neon-blue/50 text-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(0,243,255,0.6)] group"
            >
                {isOpen ? (
                    <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <div className="relative">
                        <div className="absolute inset-0 bg-neon-blue/30 blur-lg rounded-full animate-ping"></div>
                        <span className="text-2xl relative z-10">🤖</span>
                    </div>
                )}
            </button>
        </div>
    );
};

export default HelperBubble;
