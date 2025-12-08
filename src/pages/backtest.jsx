import React, { useState } from 'react';
import Layout from '../components/Layout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function BacktestPage() {
    const [config, setConfig] = useState({
        symbol: 'RELIANCE.NS',
        timeframe: 'Daily',
        strategy: 'News-Aware ML Model'
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [marketPulse, setMarketPulse] = useState({ news: [], trending: [] });

    // Fetch Live Market Data
    React.useEffect(() => {
        const fetchPulse = async () => {
            try {
                const res = await fetch('/api/market-pulse');
                if (res.ok) {
                    const data = await res.json();
                    setMarketPulse(data);
                }
            } catch (e) {
                console.error("Failed to load market pulse", e);
            }
        };
        fetchPulse();
    }, []);

    const runSimulation = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/backtest/${config.symbol}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initialCapital: 100000 })
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);
            } else {
                alert("Backtest Failed: " + (data.error || 'Unknown Error'));
            }
        } catch (e) {
            console.error(e);
            alert("Simulation Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen font-mono p-4 md:p-8 text-white">
                <h1 className="text-4xl font-bold tracking-tighter text-neon-blue glitch-text mb-8">SYSTEM_BACKTEST</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Configuration Panel */}
                    <div className="glass-panel p-6 rounded-xl border border-white/10 md:col-span-1 h-fit">
                        <h2 className="text-lg font-mono text-white mb-4 border-b border-white/10 pb-2">CONFIG_PARAMETERS</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Target Asset</label>
                                <input
                                    type="text"
                                    value={config.symbol}
                                    onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Strategy</label>
                                <select disabled className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-neon-blue focus:outline-none opacity-80 cursor-not-allowed">
                                    <option>News-Aware ML Classifier (Active)</option>
                                </select>
                            </div>
                            <div className="pt-4">
                                <button
                                    onClick={runSimulation}
                                    disabled={loading}
                                    className="w-full py-3 bg-neon-blue/10 text-neon-blue border border-neon-blue hover:bg-neon-blue hover:text-black font-bold uppercase tracking-widest text-xs transition duration-200 disabled:opacity-50"
                                >
                                    {loading ? 'SIMULATING...' : 'INITIALIZE SIMULATION'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Simulation Area */}
                    <div className="glass-panel p-6 border border-white/10 rounded-xl md:col-span-2 min-h-[500px] flex flex-col">
                        {!result ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                <div className="w-20 h-20 border-t-2 border-b-2 border-neon-blue rounded-full animate-spin mb-6 opacity-20"></div>
                                <p className="text-gray-500 animate-pulse font-mono tracking-widest">AWAITING OUTPUT...</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col space-y-6">
                                {/* Metrics Strip */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white/5 p-4 rounded border border-white/5">
                                        <p className="text-xs text-gray-400">Total Return</p>
                                        <p className={`text-xl font-bold ${result.totalReturn >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                                            {result.totalReturn.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded border border-white/5">
                                        <p className="text-xs text-gray-400">Final Equity</p>
                                        <p className="text-xl font-bold text-white">${result.finalEquity.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded border border-white/5">
                                        <p className="text-xs text-gray-400">Total Trades</p>
                                        <p className="text-xl font-bold text-white">{result.trades.length}</p>
                                    </div>
                                    {/* Placeholder for Win Rate */}
                                    <div className="bg-white/5 p-4 rounded border border-white/5">
                                        <p className="text-xs text-gray-400">Win Rate</p>
                                        <p className="text-xl font-bold text-purple-400">
                                            {result.trades.length > 0 ? ((result.trades.filter(t => t.pnl > 0).length / result.trades.filter(t => t.type === 'SELL').length) * 100).toFixed(0) : 0}%
                                        </p>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="flex-1 min-h-[300px] bg-black/20 rounded-lg p-2 border border-white/5">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={result.equityCurve}>
                                            <XAxis dataKey="date" hide />
                                            <YAxis domain={['auto', 'auto']} stroke="#333" />
                                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                            <Line type="monotone" dataKey="equity" stroke="#00f3ff" dot={false} strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Recent Trades Table */}
                                <div className="h-48 overflow-y-auto border-t border-white/10 pt-4">
                                    <table className="w-full text-left text-xs text-gray-400">
                                        <thead>
                                            <tr>
                                                <th className="pb-2">Type</th>
                                                <th className="pb-2">Price</th>
                                                <th className="pb-2">Qty</th>
                                                <th className="pb-2">PnL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.trades.slice().reverse().map((t, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className={`py-1 ${t.type === 'BUY' ? 'text-neon-green' : 'text-red-400'}`}>{t.type}</td>
                                                    <td className="py-1">${t.price.toFixed(2)}</td>
                                                    <td className="py-1">{t.quantity}</td>
                                                    <td className={`py-1 ${t.pnl > 0 ? 'text-neon-green' : t.pnl < 0 ? 'text-red-400' : ''}`}>
                                                        {t.pnl ? '$' + t.pnl.toFixed(2) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Indian Market Intelligence & News Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-panel p-6 border border-white/10 rounded-xl md:col-span-2">
                        <h3 className="text-neon-blue font-bold mb-4 tracking-widest uppercase flex justify-between items-center">
                            <span>DALAL_STREET_WIRE // MARKET_PULSE</span>
                            {marketPulse.news.length === 0 && <span className="text-[10px] animate-pulse">FETCHING_LIVE_DATA...</span>}
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {marketPulse.news.length > 0 ? marketPulse.news.slice(0, 5).map((newsItem, i) => (
                                <div key={i} className={`bg-white/5 p-4 rounded border-l-2 hover:bg-white/10 transition ${newsItem.score > 0 ? 'border-green-500' : newsItem.score < 0 ? 'border-red-500' : 'border-gray-500'}`}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-white font-bold text-sm line-clamp-2 w-3/4">{newsItem.title}</h4>
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase
                                            ${newsItem.score > 0 ? 'text-green-400 bg-green-900/30' :
                                                newsItem.score < 0 ? 'text-red-400 bg-red-900/30' :
                                                    'text-gray-400 bg-gray-700/30'}`}>
                                            {newsItem.score > 0 ? 'BULLISH' : newsItem.score < 0 ? 'BEARISH' : 'NEUTRAL'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 flex justify-between">
                                        <span>{newsItem.publisher}</span>
                                        <a href={newsItem.link} target="_blank" rel="noreferrer" className="text-neon-blue hover:underline">READ_SOURCE &gt;</a>
                                    </p>
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 py-10">Initializing News Stream...</div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-6 border border-white/10 rounded-xl">
                        <h3 className="text-purple-400 font-bold mb-4 tracking-widest uppercase flex items-center">
                            <span>NSE_TOP_MOVERS</span>
                            <span className="ml-2 text-[10px] bg-purple-900/50 px-2 py-0.5 rounded text-white text-xs">LIVE</span>
                        </h3>
                        <div className="space-y-3">
                            {marketPulse.trending.length > 0 ? marketPulse.trending.map((stock, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded hover:bg-white/10 transition cursor-pointer group"
                                    onClick={() => setConfig({ ...config, symbol: stock.symbol })}
                                >
                                    <div>
                                        <span className="block font-mono font-bold text-white group-hover:text-neon-blue text-sm">{stock.symbol}</span>
                                        <span className="text-[10px] text-gray-500 line-clamp-1 max-w-[100px]">{stock.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-mono text-xs font-bold ${stock.changePercent > 0 ? 'text-neon-green' : 'text-red-500'}`}>
                                            {stock.changePercent > 0 ? '+' : ''}{stock.changePercent ? stock.changePercent.toFixed(2) : '0.00'}%
                                        </div>
                                        <div className="text-[10px] text-gray-500">₹{stock.price ? stock.price.toFixed(2) : '0.00'}</div>
                                    </div>
                                </div>
                            )) : (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white/5 p-3 rounded h-12 animate-pulse"></div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
