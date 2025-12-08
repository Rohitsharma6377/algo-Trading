
import { Server } from 'socket.io';

export default function handler(req, res) {
  if (res.socket.server.io_custom) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });
    res.socket.server.io_custom = io;

    io.on('connection', (socket) => {
      socket.on('subscribe_watchlist', (symbols) => {
        if (Array.isArray(symbols)) {
          symbols.forEach(symbol => socket.join(symbol));
        }
      });
      socket.on('disconnect', () => {
        // Cleanup if needed
      });
    });

    // START SIMULATED FEED (Pseudo-Live)
    // This makes the app feel alive immediately without external API keys
    const MOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BTC-USD', 'ETH-USD'];

    // Store last prices to create realistic random walk
    const lastPrices = {};
    MOCK_SYMBOLS.forEach(s => lastPrices[s] = 100 + Math.random() * 500); // Random start

    if (!global.marketInterval) {
      global.marketInterval = setInterval(() => {
        MOCK_SYMBOLS.forEach(symbol => {
          // Random walk: -0.5% to +0.5% change
          const change = 1 + (Math.random() * 0.01 - 0.005);
          lastPrices[symbol] = lastPrices[symbol] * change;

          io.to(symbol).emit('price_update', {
            symbol: symbol,
            price: lastPrices[symbol].toFixed(2),
            change: ((change - 1) * 100).toFixed(2),
            timestamp: new Date().toISOString()
          });
        });
        // Also broadcast to a general room or just all connected clients for dashboard
        io.emit('market_update', {
          timestamp: new Date(),
          actives: MOCK_SYMBOLS.map(s => ({
            symbol: s,
            price: lastPrices[s].toFixed(2),
            change: (Math.random() * 2 - 1).toFixed(2) // Mock daily change
          }))
        });
      }, 2000); // Update every 2 seconds
      console.log("🟢 Market Simulation Feed Started");
    }
  }
  res.end();
}
