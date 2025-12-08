
import { create } from 'zustand';

const usePortfolioStore = create((set) => ({
    portfolio: { portfolio: {}, positions: [], openTrades: [] },
    isLoading: false,

    fetchPortfolio: async () => {
        set({ isLoading: true });
        try {
            // Using the new detailed paper trading API
            const res = await fetch('/api/paper/positions');
            const data = await res.json();
            if (res.ok) {
                set({ portfolio: data });
            }
        } catch (e) {
            console.error('Portfolio Fetch Error:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    toggleAutoTrade: async () => {
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggleAuto' })
            });
            const data = await res.json();
            // Assuming the response returns the updated portfolio object
            // We may need to re-fetch full details or merge, for now re-fetch is safer
            usePortfolioStore.getState().fetchPortfolio();
        } catch (e) {
            console.error('AutoTrade Toggle Error:', e);
        }
    }
}));

export default usePortfolioStore;
