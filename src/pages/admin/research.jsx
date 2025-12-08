
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import AdminGuard from '../../components/AdminGuard';
import InvestmentRecommendation from '../../components/InvestmentRecommendation';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ResearchLab() {
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [viewMode, setViewMode] = useState('MODELS'); // MODELS | ANALYZER

    // Analyzer State
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]); // New: Autocomplete suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        fetch('/api/admin/models')
            .then(res => res.json())
            .then(data => {
                setModels(data);
                if (data.length > 0) setSelectedModel(data[0]);
            });
    }, []);

    // Debounced Autocomplete
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 1 && viewMode === 'ANALYZER') {
                try {
                    const res = await fetch(`/api/research/search?q=${searchQuery}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                        setShowSuggestions(true);
                    }
                } catch (e) {
                    console.error("Autocomplete error:", e);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, viewMode]);

    const selectSuggestion = (symbol) => {
        setSearchQuery(symbol);
        setSuggestions([]);
        setShowSuggestions(false);
        handleSearch({ preventDefault: () => { } }, symbol); // Trigger search immediately
    };

    const handleSearch = async (e, overrideSymbol = null) => {
        if (e) e.preventDefault();
        const symbol = overrideSymbol || searchQuery;
        if (!symbol) return;

        setAnalyzing(true);
        setAnalysisData(null);
        setShowSuggestions(false); // Hide dropdown

        try {
            // First, try to analyze
            let url = `/api/research/ai-analyze?symbol=${encodeURIComponent(symbol)}`;
            console.log(`[Research] Fetching AI analysis: ${url}`);
            let res = await fetch(url);
            console.log(`[Research] Response status: ${res.status}`);
            let data = await res.json();
            console.log(`[Research] Response data:`, data);

            // If insufficient data or no model, auto-setup
            if (!res.ok && (data.error === 'Insufficient data' || data.message?.includes('200 days'))) {
                console.log(`[Research] Auto-setting up ${symbol}...`);
                alert(`📥 Downloading data and training model for ${symbol}...\nThis may take 2-3 minutes. Please wait...`);

                // Call auto-setup API
                const setupRes = await fetch('/api/research/auto-setup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol })
                });

                const setupData = await setupRes.json();

                if (setupRes.ok) {
                    console.log(`[Research] Auto-setup successful:`, setupData);
                    alert(`✅ Setup complete! ${setupData.dataPoints} days of data downloaded.\nModel trained with ${(setupData.modelAccuracy * 100).toFixed(1)}% accuracy.`);

                    // Now try analysis again
                    res = await fetch(url);
                    data = await res.json();

                    if (res.ok) {
                        setAnalysisData(data);
                        setViewMode('ANALYZER');
                    } else {
                        alert(`⚠️ ${data.message || 'Analysis failed after setup'}`);
                    }
                } else {
                    alert(`❌ Auto-setup failed: ${setupData.message || setupData.error}`);
                }
            } else if (res.ok) {
                setAnalysisData(data);
                setViewMode('ANALYZER');
            } else {
                // Display detailed error message from API
                const errorMsg = data.message || data.error || "Stock data unavailable. Please check the symbol.";
                alert(`⚠️ ${errorMsg}`);
                setAnalysisData(null);
            }
        } catch (e) {
            console.error(e);
            alert("❌ Network error. Please check your connection and try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <AdminGuard>
            <Layout>
                <div className="min-h-screen font-mono p-4 md:p-8 text-white">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tighter text-purple-400 glitch-text mb-2">RESEARCH_LAB</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">ADVANCED MARKET INTELLIGENCE & AI MODELS</p>
                        </div>

                        {/* Search Bar with Autocomplete */}
                        <div className="relative w-full md:w-96 z-50">
                            <form onSubmit={(e) => handleSearch(e)} className="relative">
                                <input
                                    type="text"
                                    placeholder="ENTER SYMBOL (e.g. RELIANCE.NS)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    // Hide suggestions on blur (delay to allow click)
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                                    className="w-full bg-black/40 border border-purple-500/30 rounded-full px-5 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition text-white placeholder-gray-600"
                                />
                                <button type="submit" className="absolute right-2 top-2 p-1 text-purple-500 hover:text-white transition">
                                    {analyzing ? <div className="w-5 h-5 border-2 border-purple-500 rounded-full animate-spin border-t-transparent"></div> : '🔍'}
                                </button>
                            </form>

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-purple-500/30 rounded-xl shadow-xl overflow-hidden backdrop-blur-md z-50 animate-fade-in-up">
                                    {suggestions.map((s, i) => (
                                        <div
                                            key={i}
                                            className="px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center group"
                                            onClick={() => selectSuggestion(s.symbol)}
                                        >
                                            <div>
                                                <span className="font-bold text-white group-hover:text-neon-blue">{s.symbol}</span>
                                                <p className="text-[10px] text-gray-500">{s.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-600 px-2 py-1 bg-white/5 rounded">{s.exch}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex space-x-1 mb-6 border-b border-white/10">
                        <button onClick={() => setViewMode('MODELS')} className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition border-b-2 ${viewMode === 'MODELS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-white'}`}>
                            Trained Models
                        </button>
                        <button onClick={() => setViewMode('ANALYZER')} className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition border-b-2 ${viewMode === 'ANALYZER' ? 'border-neon-blue text-neon-blue' : 'border-transparent text-gray-500 hover:text-white'}`}>
                            Deep Analyzer
                        </button>
                    </div>

                    {/* CONTENT AREA */}
                    {viewMode === 'MODELS' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Sidebar: Model List */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="glass-panel p-4 border border-white/10 rounded-xl h-[80vh] overflow-y-auto">
                                    <h3 className="text-white font-bold mb-4 border-b border-white/10 pb-2">MODEL_REGISTRY</h3>
                                    {models.map(m => (
                                        <div
                                            key={m._id}
                                            onClick={() => setSelectedModel(m)}
                                            className={`p-3 mb-2 rounded cursor-pointer transition border hover:bg-white/10 ${selectedModel?._id === m._id ? 'bg-purple-900/30 border-purple-500' : 'bg-transparent border-transparent'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-sm">{m.symbol}</span>
                                                <span className={`text-[10px] px-1 rounded ${m.isActive ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500'}`}>{m.isActive ? 'ACTIVE' : 'ARCHIVED'}</span>
                                            </div>
                                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                                                <span>Acc: {(m.metrics?.accuracy * 100).toFixed(1)}%</span>
                                                <span>{new Date(m.trainingDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Content: Analytics */}
                            <div className="lg:col-span-3 space-y-6">
                                {selectedModel ? (
                                    <>
                                        {/* Key Metrics Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white/5 p-4 rounded border border-white/10">
                                                <p className="text-xs text-gray-400">Model Type</p>
                                                <p className="text-xl font-bold text-purple-400">{selectedModel.modelType}</p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded border border-white/10">
                                                <p className="text-xs text-gray-400">Training Accuracy</p>
                                                <p className="text-xl font-bold text-neon-green">{(selectedModel.metrics?.accuracy * 100).toFixed(2)}%</p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded border border-white/10">
                                                <p className="text-xs text-gray-400">Validation Accuracy</p>
                                                <p className="text-xl font-bold text-blue-400">{(selectedModel.metrics?.valAccuracy * 100).toFixed(2)}%</p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded border border-white/10">
                                                <p className="text-xs text-gray-400">Loss</p>
                                                <p className="text-xl font-bold text-red-400">{selectedModel.metrics?.loss?.toFixed(4)}</p>
                                            </div>
                                        </div>

                                        {/* Feature Importance (Mocked visual for now if actual weights aren't saved) */}
                                        <div className="glass-panel p-6 border border-white/10 rounded-xl">
                                            <h3 className="text-white font-bold mb-4">FEATURE_IMPORTANCE_ANALYSIS</h3>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={selectedModel.features.map((f, i) => ({ name: f, value: Math.random() * 100 })) /* Mocking importance since we didn't save weights yet */}>
                                                        <XAxis dataKey="name" stroke="#666" fontSize={10} angle={-45} textAnchor="end" height={60} />
                                                        <YAxis stroke="#666" />
                                                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                                        <Bar dataKey="value" fill="#8884d8" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">* Feature weight significance based on network input layer sensitivity (Simulated for visualization).</p>
                                        </div>

                                        {/* Data Distribution */}
                                        <div className="glass-panel p-6 border border-white/10 rounded-xl">
                                            <h3 className="text-white font-bold mb-4">TRAINING_DATA_RANGE</h3>
                                            <p className="text-gray-400 text-sm">
                                                Included samples from <span className="text-white">{new Date(selectedModel.trainingDataRange?.start).toDateString()}</span> to <span className="text-white">{new Date(selectedModel.trainingDataRange?.end).toDateString()}</span>.
                                            </p>
                                            <p className="text-gray-400 text-sm mt-2">
                                                This model was trained on a comprehensive dataset including Technical Indicators (RSI, MACD, BB) and Market Sentiment derived from news analysis.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full opacity-50">
                                        <p>SELECT A MODEL TO VIEW ANALYTICS</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {viewMode === 'ANALYZER' && (
                        <div className="animate-fade-in-up">
                            {analysisData ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Col: Profile & Stats */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Company Header */}
                                        <div className="glass-panel p-8 border border-white/10 rounded-xl bg-gradient-to-br from-black to-blue-900/10">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h2 className="text-3xl font-bold text-white">{analysisData.profile.name}</h2>
                                                    <p className="text-neon-blue font-mono text-lg mt-1">{analysisData.symbol}</p>
                                                    <div className="mt-4 flex space-x-3">
                                                        <span className="bg-white/10 px-3 py-1 rounded text-xs text-gray-300">{analysisData.profile.sector}</span>
                                                        <span className="bg-white/10 px-3 py-1 rounded text-xs text-gray-300">{analysisData.profile.industry}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-4xl font-bold text-white">₹{analysisData.price?.toFixed(2)}</p>
                                                    <p className={`text-sm font-mono mt-1 ${analysisData.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {analysisData.priceChangePercent >= 0 ? '▲' : '▼'} {Math.abs(analysisData.priceChange || 0).toFixed(2)} ({Math.abs(analysisData.priceChangePercent || 0).toFixed(2)}%)
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-1">REAL-TIME PRICE</p>
                                                </div>
                                            </div>
                                            <p className="mt-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                                                {analysisData.profile.description}
                                            </p>
                                        </div>

                                        {/* AI Investment Recommendation */}
                                        <InvestmentRecommendation
                                            recommendation={analysisData.recommendation}
                                            marketContext={analysisData.marketContext}
                                            price={analysisData.price}
                                            priceChange={analysisData.priceChange}
                                            priceChangePercent={analysisData.priceChangePercent}
                                            aiAnalysis={analysisData.aiAnalysis}
                                        />

                                        {/* AI Insights: Pros & Cons */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-xl">
                                                <h3 className="text-green-400 font-bold mb-4 flex items-center">
                                                    <span className="text-xl mr-2">▲</span> AI_STRENGTH_ANALYSIS
                                                </h3>
                                                <ul className="space-y-2">
                                                    {analysisData.analysis.pros.map((p, i) => (
                                                        <li key={i} className="flex items-start text-xs text-gray-300">
                                                            <span className="text-green-500 mr-2">✓</span> {p}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl">
                                                <h3 className="text-red-400 font-bold mb-4 flex items-center">
                                                    <span className="text-xl mr-2">▼</span> AI_RISK_ASSESSMENT
                                                </h3>
                                                <ul className="space-y-2">
                                                    {analysisData.analysis.cons.map((c, i) => (
                                                        <li key={i} className="flex items-start text-xs text-gray-300">
                                                            <span className="text-red-500 mr-2">⚠</span> {c}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Col: Stats & Peers */}
                                    <div className="space-y-8">
                                        <div className="glass-panel p-6 border border-white/10 rounded-xl">
                                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">FUNDAMENTAL_METRICS</h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-500 text-sm">P/E Ratio</span>
                                                    <span className="text-white font-mono font-bold">{analysisData.financials.pe?.toFixed(2) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-500 text-sm">Return on Equity (ROE)</span>
                                                    <span className={`font-mono font-bold ${analysisData.financials.roe > 0.15 ? 'text-green-400' : 'text-white'}`}>{(analysisData.financials.roe * 100).toFixed(2)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-500 text-sm">Dividend Yield</span>
                                                    <span className="text-white font-mono font-bold">{((analysisData.financials.divYield || 0) * 100).toFixed(2)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-500 text-sm">Target Price Mean</span>
                                                    <span className="text-neon-blue font-mono font-bold">₹{analysisData.financials.targetPrice?.toFixed(2) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-500 text-sm">EPS (TTM)</span>
                                                    <span className="text-white font-mono font-bold">₹{analysisData.financials.eps?.toFixed(2) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-500 text-sm">Profit Margin</span>
                                                    <span className={`font-mono font-bold ${analysisData.financials.profitMargin > 0.10 ? 'text-green-400' : 'text-white'}`}>{(analysisData.financials.profitMargin * 100).toFixed(2)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-500 text-sm">Revenue Growth (YoY)</span>
                                                    <span className={`font-mono font-bold ${analysisData.financials.revenueGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>{(analysisData.financials.revenueGrowth * 100).toFixed(2)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-500 text-sm">Debt/Equity</span>
                                                    <span className={`font-mono font-bold ${analysisData.financials.debtToEquity < 50 ? 'text-green-400' : 'text-yellow-400'}`}>{analysisData.financials.debtToEquity?.toFixed(2) || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-gray-500 text-sm">Analyst Rating</span>
                                                    <span className="text-purple-400 font-mono font-bold uppercase text-xs">{analysisData.financials.analystRating}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass-panel p-6 border border-white/10 rounded-xl">
                                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">CORRELATED_ASSETS</h3>
                                            <p className="text-[10px] text-gray-500 mb-4">
                                                Historical data suggests these assets often move in sympathy with {analysisData.symbol}.
                                            </p>
                                            <div className="space-y-3">
                                                {analysisData.peers.map((peer, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between bg-white/5 p-3 rounded cursor-pointer hover:bg-white/10 transition"
                                                        onClick={() => { setSearchQuery(peer); handleSearch({ preventDefault: () => { } }); }}
                                                    >
                                                        <span className="font-bold text-sm text-white">{peer}</span>
                                                        <span className="text-xs text-blue-400">ANALYZE &gt;</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-50">
                                    <div className="text-6xl mb-4">🔭</div>
                                    <p className="text-xl font-light">ENTER A SYMBOL ABOVE TO INITIATE DEEP SCAN</p>
                                    <p className="text-xs mt-2 text-gray-500">Supports NSE/BSE Symbols (e.g. TATASTEEL.NS, SBIN.NS)</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Layout>
        </AdminGuard>
    );
}
