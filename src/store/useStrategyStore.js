
import { create } from 'zustand';

const useStrategyStore = create((set) => ({
    selectedStrategy: 'ML_ENHANCED',
    signals: [], // [{ symbol, action, price, strategy, timestamp }]
    indicatorSettings: {
        rsiPeriod: 14,
        smaFast: 20,
        smaSlow: 50
    },

    setStrategy: (strat) => set({ selectedStrategy: strat }),

    addSignal: (signal) => set((state) => ({
        signals: [signal, ...state.signals].slice(0, 100) // Keep last 100
    })),

    updateIndicatorSettings: (settings) => set((state) => ({
        indicatorSettings: { ...state.indicatorSettings, ...settings }
    }))
}));

export default useStrategyStore;
