
import { create } from 'zustand';
import io from 'socket.io-client';
import useStockStore from './useStockStore';

let socket = null;

const useSocketStore = create((set, get) => ({
    isConnected: false,
    socketInstance: null,
    isConnecting: false,

    initSocket: async () => {
        // Prevent multiple initializations (Singleton check)
        if (socket && socket.connected) {
            console.log('Socket already initialized and connected.');
            return;
        }

        // Prevent race conditions 
        if (get().isConnecting) return;
        set({ isConnecting: true });

        try {
            // Ensure the endpoint exists
            await fetch('/api/socket');

            if (!socket) {
                socket = io({
                    path: '/api/socketio',
                    addTrailingSlash: false,
                    transports: ['websocket'], // Force websocket
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });
            } else {
                if (!socket.connected) socket.connect();
            }

            // Clean up old listeners to prevent duplicates
            socket.removeAllListeners();

            socket.on('connect', () => {
                console.log('🔌 Socket Connected:', socket.id);
                set({ isConnected: true, socketInstance: socket, isConnecting: false });
            });

            socket.on('disconnect', (reason) => {
                console.warn('🔌 Socket Disconnected:', reason);
                set({ isConnected: false });
            });

            socket.on('connect_error', (err) => {
                console.error('🔌 Socket Connection Error:', err.message);
                set({ isConnecting: false });
            });

            socket.on('prediction_update', (data) => {
                useStockStore.getState().setPrediction(data);
            });

        } catch (e) {
            console.error('Socket init error:', e);
            set({ isConnecting: false });
        }
    },

    subscribeToSymbol: (symbol) => {
        if (socket && socket.connected && symbol) {
            // De-duplicate subscriptions logic could go here
            socket.emit('subscribe_watchlist', [symbol]);
        }
    }
}));

export default useSocketStore;
