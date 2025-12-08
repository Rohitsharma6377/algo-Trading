import React from 'react';

export default function InvestmentRecommendation({ recommendation, marketContext, price, priceChange, priceChangePercent, aiAnalysis }) {
    const getActionColor = (action) => {
        if (action?.includes('BUY')) return 'text-green-400 bg-green-900/20 border-green-500';
        if (action?.includes('SELL')) return 'text-red-400 bg-red-900/20 border-red-500';
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
    };

    const getRiskColor = (risk) => {
        if (risk === 'LOW') return 'text-green-400';
        if (risk === 'MEDIUM') return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="glass-panel p-8 border border-white/10 rounded-xl bg-gradient-to-br from-purple-900/10 to-blue-900/10">
            {/* Header with Action */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">AI Investment Recommendation</h3>
                    <p className="text-xs text-gray-400">
                        {aiAnalysis?.mlPrediction ? (
                            <>Powered by Machine Learning • {aiAnalysis.dataPointsAnalyzed} days analyzed • {aiAnalysis.newsItemsAnalyzed} news articles</>
                        ) : (
                            'Based on comprehensive technical & fundamental analysis'
                        )}
                    </p>
                </div>
                <div className={`px-6 py-3 rounded-lg border-2 ${getActionColor(recommendation?.action)}`}>
                    <p className="text-2xl font-bold">{recommendation?.action || 'ANALYZING'}</p>
                </div>
            </div>

            {/* Confidence & Scores */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Confidence</p>
                    <div className="flex items-end">
                        <p className="text-3xl font-bold text-neon-blue">{recommendation?.confidence?.toFixed(0) || 0}</p>
                        <span className="text-gray-500 ml-1 mb-1">/100</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                        <div
                            className="bg-neon-blue h-2 rounded-full transition-all"
                            style={{ width: `${recommendation?.confidence || 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Technical Score</p>
                    <div className="flex items-end">
                        <p className="text-3xl font-bold text-purple-400">{recommendation?.technicalScore?.toFixed(0) || 0}</p>
                        <span className="text-gray-500 ml-1 mb-1">/100</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                        <div
                            className="bg-purple-400 h-2 rounded-full transition-all"
                            style={{ width: `${recommendation?.technicalScore || 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Fundamental Score</p>
                    <div className="flex items-end">
                        <p className="text-3xl font-bold text-green-400">{recommendation?.fundamentalScore?.toFixed(0) || 0}</p>
                        <span className="text-gray-500 ml-1 mb-1">/100</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                        <div
                            className="bg-green-400 h-2 rounded-full transition-all"
                            style={{ width: `${recommendation?.fundamentalScore || 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* ML Prediction Probabilities (if available) */}
            {aiAnalysis?.mlPrediction && (
                <div className="mb-6 p-4 bg-black/30 rounded-lg border border-purple-500/30">
                    <h4 className="text-xs font-bold text-purple-400 mb-3">NEURAL NETWORK PREDICTION</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-green-400">BUY</span>
                                <span className="text-white font-bold">{aiAnalysis.mlPrediction.buyProb.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full">
                                <div className="bg-green-400 h-2 rounded-full" style={{ width: `${aiAnalysis.mlPrediction.buyProb}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-yellow-400">HOLD</span>
                                <span className="text-white font-bold">{aiAnalysis.mlPrediction.holdProb.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full">
                                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${aiAnalysis.mlPrediction.holdProb}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-red-400">SELL</span>
                                <span className="text-white font-bold">{aiAnalysis.mlPrediction.sellProb.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full">
                                <div className="bg-red-400 h-2 rounded-full" style={{ width: `${aiAnalysis.mlPrediction.sellProb}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                        Model Accuracy: {(aiAnalysis.modelAccuracy * 100).toFixed(1)}% •
                        Last Trained: {aiAnalysis.modelLastTrained ? new Date(aiAnalysis.modelLastTrained).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
            )}

            {/* Reasoning */}
            <div className="bg-black/30 p-4 rounded-lg mb-6 border-l-4 border-neon-blue">
                <p className="text-sm text-gray-300 leading-relaxed">{recommendation?.reasoning || 'Analyzing market data...'}</p>
            </div>

            {/* Investment Details */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Time Horizon</span>
                    <span className="text-white font-mono font-bold">{recommendation?.timeHorizon?.replace('_', ' ') || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Risk Level</span>
                    <span className={`font-mono font-bold ${getRiskColor(recommendation?.riskLevel)}`}>{recommendation?.riskLevel || 'N/A'}</span>
                </div>
            </div>

            {/* Market Position */}
            {marketContext && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-sm font-bold text-gray-400 mb-3">MARKET POSITION</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <span className="text-gray-500">52W High:</span>
                            <span className="text-white ml-2">₹{marketContext.fiftyTwoWeekHigh?.toFixed(2)}</span>
                            <span className="text-red-400 ml-1">({marketContext.percentFromHigh}%)</span>
                        </div>
                        <div>
                            <span className="text-gray-500">52W Low:</span>
                            <span className="text-white ml-2">₹{marketContext.fiftyTwoWeekLow?.toFixed(2)}</span>
                            <span className="text-green-400 ml-1">(+{marketContext.percentFromLow}%)</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Beta:</span>
                            <span className="text-white ml-2">{marketContext.beta?.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Avg Volume:</span>
                            <span className="text-white ml-2">{(marketContext.avgVolume / 1000000).toFixed(2)}M</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
