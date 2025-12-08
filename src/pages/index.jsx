
import React, { useEffect, useState } from 'react';
import useUserStore from '../store/useUserStore';
import useStockStore from '../store/useStockStore';
import useSocketStore from '../store/useSocketStore';
import { useRouter } from 'next/router';
import StockCard from '../components/StockCard';
import HelperBubble from '../components/HelperBubble.jsx'; // Explicit extension
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Dashboard() {
    const { user, isAuthenticated, isLoading: userLoading, fetchUser } = useUserStore();
    const { watchlist, addToWatchlist, removeFromWatchlist, predictions } = useStockStore();
    const { initSocket, subscribeToSymbol } = useSocketStore();
    const [inputSymbol, setInputSymbol] = useState('');
    const [portfolio, setPortfolio] = useState(null);
    const [showLoginLink, setShowLoginLink] = useState(false);
    const router = useRouter();

    const fetchPortfolio = async () => {
        try {
            const res = await fetch('/api/portfolio');
            const data = await res.json();
            setPortfolio(data.portfolio);
        } catch (e) {
            console.error(e);
        }
    };


    const initRef = React.useRef(false);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        fetchUser();
        initSocket();

        // fetchPortfolio is safe to call
        fetchPortfolio();

        // Safety timeout
        const timer = setTimeout(() => {
            if (!useUserStore.getState().isAuthenticated) {
                // Check if we are really stuck or just not logged in (which is fine)
                // If isLoading is still true, then we are stuck.
                if (useUserStore.getState().isLoading) {
                    setShowLoginLink(true);
                }
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, []); // Empty dependency array as these actions are stable or guarded


    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, userLoading, router]);

    const toggleAutoTrade = async () => {
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggleAuto' })
            });
            const data = await res.json();
            setPortfolio(data.portfolio);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddStock = (e) => {
        e.preventDefault();
        if (inputSymbol) {
            const sym = inputSymbol.toUpperCase();
            addToWatchlist(sym);
            subscribeToSymbol(sym);
            setInputSymbol('');
            fetch(`/api/predict/${sym}`).catch(err => console.error(err));
        }
    };


    useEffect(() => {
        if (user && user.role === 'admin') {
            router.push('/admin');
        }
    }, [user, router]);

    // Show loading only if genuinely loading user or checking auth
    if (userLoading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-mono text-neon-blue animate-pulse">INITIALIZING SYSTEM...</p>
        </div>
    );

    // If not authenticated and not loading, the useEffect above will redirect. 
    // We render nothing or a simple redirecting message while that happens.
    if (!isAuthenticated) return null;

    return (
        <Layout>
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">

                {/* Hero / Search Section */}
                <div className="mb-16 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">Predict the</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple animate-glow-pulse"> Future Market</span>
                    </h1>

                    <form onSubmit={handleAddStock} className="relative max-w-2xl mx-auto group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative">
                            <input
                                type="text"
                                value={inputSymbol}
                                onChange={(e) => setInputSymbol(e.target.value)}
                                placeholder="ENTER ASSET SYMBOL (e.g. BTC-USD, AAPL)..."
                                className="w-full bg-black/80 border border-gray-700/50 rounded-lg py-5 px-8 text-xl font-mono text-white focus:outline-none focus:border-neon-blue/50 placeholder-gray-600 transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-3 bottom-3 px-6 bg-white/5 hover:bg-neon-blue/20 text-neon-blue rounded font-mono font-bold tracking-widest border border-white/10 hover:border-neon-blue/50 transition-all"
                            >
                                ADD +
                            </button>
                        </div>
                    </form>
                </div>



                {/* Portfolio Section */}
                {
                    portfolio && (
                        <div className="mb-12">
                            <div className="glass-panel p-6 rounded-xl border border-neon-blue/20">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-mono text-white">NEURAL_PORTFOLIO</h2>
                                        <p className="text-gray-400 text-xs tracking-wider">PAPER TRADING SIMULATION</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase">Balance</p>
                                            <p className="text-2xl font-mono text-neon-green">${portfolio.balance.toFixed(2)}</p>
                                        </div>
                                        <button
                                            onClick={toggleAutoTrade}
                                            className={`px-4 py-2 rounded font-mono text-xs font-bold border ${portfolio.isAutoTrading ? 'bg-neon-green/20 border-neon-green text-neon-green animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            {portfolio.isAutoTrading ? 'AUTO-TRADE: ON' : 'AUTO-TRADE: OFF'}
                                        </button>
                                    </div>
                                </div>

                                {portfolio.holdings.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 font-mono text-sm">
                                        NO ASSETS DETECTED. ENABLE AUTO-TRADE OR AWAIT SIGNALS.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left font-mono text-sm">
                                            <thead className="text-gray-500 border-b border-gray-700">
                                                <tr>
                                                    <th className="pb-2">ASSET</th>
                                                    <th className="pb-2">QTY</th>
                                                    <th className="pb-2">AVG PRICE</th>
                                                    <th className="pb-2">VALUE</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {portfolio.holdings.map(h => (
                                                    <tr key={h.symbol} className="group hover:bg-white/5">
                                                        <td className="py-3 text-neon-blue font-bold">{h.symbol}</td>
                                                        <td className="py-3">{h.quantity}</td>
                                                        <td className="py-3">${h.averageBuyPrice.toFixed(2)}</td>
                                                        <td className="py-3 text-white">${(h.quantity * h.averageBuyPrice).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Watchlist Grid */}

                {
                    watchlist.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl bg-black/20">
                            <div className="text-6xl mb-4 grayscale opacity-20">📊</div>
                            <p className="text-2xl text-gray-500 font-thin">System Idle.</p>
                            <p className="text-sm text-gray-600 font-mono mt-2 uppercase tracking-widest">Add assets to initialize neural monitoring.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {watchlist.map((symbol) => (
                                <div key={symbol} className="relative group">
                                    <button
                                        onClick={() => removeFromWatchlist(symbol)}
                                        className="absolute -top-3 -right-3 z-20 w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full border border-red-500/30 opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                    <StockCard
                                        symbol={symbol}
                                        prediction={predictions[symbol]}
                                    />
                                </div>
                            ))}
                        </div>
                    )
                }

            </div>
            <HelperBubble />
        </Layout>
    );
}
