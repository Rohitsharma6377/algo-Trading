
import { create } from 'zustand';
import io from 'socket.io-client';
import useStockStore from './useStockStore';

let socket;

const useSocketStore = create((set, get) => ({
    isConnected: false,

    initSocket: () => {
        if (socket) return;

        // Trigger socket server init
        fetch('/api/socket');

        socket = io();

        socket.on('connect', () => {
            console.log('🔌 Socket Connected');
            set({ isConnected: true });
        });

        socket.on('disconnect', () => {
            console.log('🔌 Socket Disconnected');
            set({ isConnected: false });
        });

        socket.on('prediction_update', (data) => {
            useStockStore.getState().setPrediction(data);
        });

        // Handle other events if needed
    },

    subscribeToSymbol: (symbol) => {
        if (socket && symbol) {
            socket.emit('subscribe_watchlist', [symbol]);
        }
    }
}));

export default useSocketStore;
