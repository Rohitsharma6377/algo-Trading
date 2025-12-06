import { create } from 'zustand';

/**
 * Zustand store for client-side state management
 */
const useStore = create((set, get) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),

  // Watchlist
  watchlist: [],
  setWatchlist: (watchlist) => set({ watchlist }),
  addToWatchlist: (symbol) => {
    const current = get().watchlist;
    if (!current.includes(symbol)) {
      set({ watchlist: [...current, symbol] });
    }
  },
  removeFromWatchlist: (symbol) => {
    set({ watchlist: get().watchlist.filter(s => s !== symbol) });
  },

  // Predictions
  predictions: [],
  setPredictions: (predictions) => set({ predictions }),
  addPrediction: (prediction) => {
    const current = get().predictions;
    const index = current.findIndex(p => p.symbol === prediction.symbol);
    
    if (index >= 0) {
      // Update existing
      const updated = [...current];
      updated[index] = { ...updated[index], ...prediction };
      set({ predictions: updated });
    } else {
      // Add new
      set({ predictions: [...current, prediction] });
    }
  },

  // Portfolio
  portfolio: null,
  setPortfolio: (portfolio) => set({ portfolio }),

  // Positions
  positions: [],
  setPositions: (positions) => set({ positions }),

  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const id = Date.now();
    set({ 
      notifications: [...get().notifications, { ...notification, id }] 
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set({ 
        notifications: get().notifications.filter(n => n.id !== id) 
      });
    }, 5000);
  },
  removeNotification: (id) => {
    set({ 
      notifications: get().notifications.filter(n => n.id !== id) 
    });
  },
}));

export default useStore;
