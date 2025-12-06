
import { create } from 'zustand';

const useStockStore = create((set, get) => ({
    watchlist: [],
    rankedStocks: [],
    predictions: {}, // { "AAPL": { ...predictionData } }
    isLoadingRankings: false,
    rankingLastUpdated: 0,

    setPrediction: (data) => {
        set((state) => ({
            predictions: { ...state.predictions, [data.symbol]: data }
        }));
    },

    addToWatchlist: (symbol) => {
        set((state) => {
            if (!state.watchlist.includes(symbol)) {
                return { watchlist: [...state.watchlist, symbol] };
            }
            return state;
        });
    },

    removeFromWatchlist: (symbol) => {
        set((state) => ({ watchlist: state.watchlist.filter((s) => s !== symbol) }));
    },

    fetchRankedStocks: async (force = false) => {
        const { isLoadingRankings, rankingLastUpdated } = get();
        const now = Date.now();

        // Prevent concurrent fetches or fetching too frequently (10s cooldown) unless forced
        if (isLoadingRankings) return;
        if (!force && (now - rankingLastUpdated < 10000)) {
            // console.log('Skipping rank fetch (cooldown active)');
            return;
        }

        set({ isLoadingRankings: true });
        try {
            console.log('Fetching daily rankings...');
            const res = await fetch('/api/rank-daily');

            if (!res.ok) {
                console.error('Failed to fetch rankings:', res.status, res.statusText);
                return;
            }

            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (data.ranked) {
                    set({ rankedStocks: data.ranked, rankingLastUpdated: now });
                }
            } catch (err) {
                console.error('CRITICAL: Rank API returned non-JSON:', text.substring(0, 100));
            }

        } catch (e) {
            console.error('Rank fetch error:', e);
        } finally {
            set({ isLoadingRankings: false });
        }
    },
}));

export default useStockStore;
