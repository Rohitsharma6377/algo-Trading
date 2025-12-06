
import { create } from 'zustand';

const useAdminStore = create((set) => ({
    logs: [],
    loadingAction: false,

    addLog: (type, msg) => set((state) => ({
        logs: [{ type, msg, time: new Date().toLocaleTimeString() }, ...state.logs]
    })),

    setLoading: (loading) => set({ loadingAction: loading }),

    runAdminAction: async (action, symbol) => {
        set({ loadingAction: true });
        const { addLog } = useAdminStore.getState();

        addLog('INFO', `INITIATING ${action.toUpperCase()} PROTOCOL FOR [${symbol}]...`);

        try {
            const res = await fetch(`/api/${action}/${symbol}`, { method: action === 'train' ? 'POST' : 'GET' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed');

            addLog('SUCCESS', `PROTOCOL COMPLETE: ${JSON.stringify(data)}`);
            return data;
        } catch (error) {
            addLog('ERROR', `SYSTEM FAILURE: ${error.message}`);
            return null;
        } finally {
            set({ loadingAction: false });
        }
    }
}));

export default useAdminStore;
