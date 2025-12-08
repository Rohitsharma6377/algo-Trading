
import React, { useEffect, useState } from 'react';
import useUserStore from '../store/useUserStore';
import Link from 'next/link';
import Layout from '../components/Layout'; // Use the refactored Layout

import usePortfolioStore from '../store/usePortfolioStore';

export default function PortfolioPage() {
    const { user, isAuthenticated, isLoading: userLoading, fetchUser } = useUserStore();
    const { portfolio: data, isLoading: portfolioLoading, fetchPortfolio } = usePortfolioStore();

    useEffect(() => {
        fetchUser();
        fetchPortfolio();
    }, [fetchUser]);


    // Data fetching is handled by store


    if (userLoading || portfolioLoading || !data) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-mono text-neon-blue animate-pulse">LOADING ASSETS...</p>
        </div>
    );

    const { portfolio = {}, positions = [], openTrades = [], equityCurve = [] } = data || {};

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-8 text-white">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue">
                        ASSET_PORTFOLIO
                    </h1>
                    <p className="text-gray-400 font-mono text-sm uppercase tracking-widest mt-2">
                        PAPER TRADING TERMINAL
                    </p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="glass-panel p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:border-neon-green/50 transition">
                        <div className="absolute top-0 right-0 p-3 opacity-10 text-6xl">💰</div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Total Equity</p>
                        <p className="text-3xl font-mono text-white mt-1 group-hover:text-neon-green transition">
                            ${portfolio?.equity}
                        </p>
                    </div>
                    <div className="glass-panel p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:border-neon-blue/50 transition">
                        <div className="absolute top-0 right-0 p-3 opacity-10 text-6xl">💳</div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Available Cash</p>
                        <p className="text-3xl font-mono text-white mt-1 group-hover:text-neon-blue transition">
                            ${portfolio?.cash}
                        </p>
                    </div>
                    <div className="glass-panel p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:border-purple-500/50 transition">
                        <div className="absolute top-0 right-0 p-3 opacity-10 text-6xl">📈</div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Total Return</p>
                        <p className={`text-3xl font-mono mt-1 ${parseFloat(portfolio?.totalReturn) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {portfolio?.totalReturn}
                        </p>
                    </div>
                    <div className="glass-panel p-6 rounded-xl border border-white/10 relative overflow-hidden hover:border-orange-500/50 transition">
                        <div className="absolute top-0 right-0 p-3 opacity-10 text-6xl">📊</div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Realized P&L</p>
                        <p className={`text-3xl font-mono mt-1 ${parseFloat(portfolio?.realizedPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${portfolio?.realizedPnl}
                        </p>
                    </div>
                </div>

                {/* Positions Table */}
                <div className="glass-panel rounded-xl overflow-hidden border border-white/10 mb-8">
                    <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-lg font-mono text-neon-blue">OPEN_POSITIONS</h2>
                        <span className="text-xs text-gray-400 bg-black/50 px-2 py-1 rounded border border-white/10">{positions?.length} ACTIVE</span>
                    </div>

                    {positions?.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-mono">
                            NO ACTIVE POSITIONS DETECTED.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-mono text-sm">
                                <thead className="bg-black/20 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">SYMBOL</th>
                                        <th className="px-6 py-3">QTY</th>
                                        <th className="px-6 py-3">AVG PRICE</th>
                                        <th className="px-6 py-3">CURRENT</th>
                                        <th className="px-6 py-3">VALUE</th>
                                        <th className="px-6 py-3">P&L</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {positions.map((pos, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition">
                                            <td className="px-6 py-4 font-bold text-white">{pos.symbol}</td>
                                            <td className="px-6 py-4 text-gray-300">{pos.quantity}</td>
                                            <td className="px-6 py-4 text-gray-400">${pos.avgPrice}</td>
                                            <td className="px-6 py-4 text-white">${pos.currentPrice}</td>
                                            <td className="px-6 py-4 text-neon-blue">${pos.value}</td>
                                            <td className={`px-6 py-4 ${parseFloat(pos.unrealizedPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ${pos.unrealizedPnl}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Trades Table (optional, reuse logic if needed, or just show open trades) */}
                <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
                    <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                        <h2 className="text-lg font-mono text-purple-400">ACTIVE_ORDERS</h2>
                    </div>
                    {openTrades?.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-mono">
                            NO PENDING ORDERS.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-mono text-sm">
                                <thead className="bg-black/20 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">SYMBOL</th>
                                        <th className="px-6 py-3">QTY</th>
                                        <th className="px-6 py-3">ENTRY</th>
                                        <th className="px-6 py-3">DATE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {openTrades.map((t, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition">
                                            <td className="px-6 py-4 font-bold text-white">{t.symbol}</td>
                                            <td className="px-6 py-4 text-gray-300">{t.quantity}</td>
                                            <td className="px-6 py-4 text-gray-400">${t.entryPrice}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                {new Date(t.entryDate).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
}
