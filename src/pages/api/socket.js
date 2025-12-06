
import { Server } from 'socket.io';

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('subscribe_watchlist', (symbols) => {
        if (Array.isArray(symbols)) {
          symbols.forEach(symbol => socket.join(symbol));
        }
      });
    });
  }
  res.end();
}
