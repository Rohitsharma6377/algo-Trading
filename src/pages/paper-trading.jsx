import React, { useState } from 'react';
import Layout from '../components/Layout';

export default function PaperTradingPage() {
    const [activeTab, setActiveTab] = useState('trade');

    return (
        <Layout>
            <div className="min-h-screen font-mono p-4 md:p-8 text-white">
                <header className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter text-purple-500 glitch-text">PAPER_TRADING</h1>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">SIMULATION ENVIRONMENT // VIRTUAL CAPITAL</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Virtual Balance</p>
                        <p className="text-2xl font-bold text-white">$100,000.00</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Order Entry */}
                    <div className="lg:col-span-1">
                        <div className="glass-panel p-6 rounded-xl border border-white/10">
                            <div className="flex space-x-1 bg-white/5 p-1 rounded mb-6">
                                <button
                                    onClick={() => setActiveTab('trade')}
                                    className={`flex-1 py-1 text-xs uppercase font-bold tracking-wider rounded transition ${activeTab === 'trade' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Trade
                                </button>
                                <button
                                    onClick={() => setActiveTab('manage')}
                                    className={`flex-1 py-1 text-xs uppercase font-bold tracking-wider rounded transition ${activeTab === 'manage' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Orders
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Symbol</label>
                                    <input type="text" placeholder="AAPL" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Action</label>
                                        <select className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none">
                                            <option>BUY</option>
                                            <option>SELL</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Type</label>
                                        <select className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none">
                                            <option>MARKET</option>
                                            <option>LIMIT</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Quantity</label>
                                    <input type="number" placeholder="0" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition" />
                                </div>

                                <div className="pt-4 flex space-x-3">
                                    <button className="flex-1 py-3 bg-green-500/10 text-green-500 border border-green-500 hover:bg-green-500 hover:text-black font-bold uppercase tracking-widest text-xs transition duration-200">
                                        Buy
                                    </button>
                                    <button className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500 hover:bg-red-500 hover:text-black font-bold uppercase tracking-widest text-xs transition duration-200">
                                        Sell
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts / Data Area */}
                    <div className="lg:col-span-2">
                        <div className="glass-panel border border-white/10 rounded-xl h-[500px] flex flex-col relative overflow-hidden">
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-gray-400 border border-white/5">
                                CHART_FEED: DISCONNECTED
                            </div>

                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center opacity-30">
                                    <div className="text-6xl mb-4">📉</div>
                                    <p className="text-sm font-mono tracking-widest">NO MARKET DATA STREAM</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
