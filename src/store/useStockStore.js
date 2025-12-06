
import { create } from 'zustand';

const useStockStore = create((set, get) => ({
    watchlist: [],
    rankedStocks: [],
    predictions: {}, // { "AAPL": { ...predictionData } }
    isLoadingRankings: false,

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

    fetchRankedStocks: async () => {
        // Prevent concurrent fetches if already loading
        if (get().isLoadingRankings) return;

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
                    set({ rankedStocks: data.ranked });
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
