/**
 * Socket.IO manager for emitting events
 * Manages real-time communications
 */

let socketIO;

/**
 * Set Socket.IO instance
 */
function setIO(io) {
  socketIO = io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  return socketIO;
}

/**
 * Emit event to specific room
 * @param {string} room - Room name (e.g., 'symbol:AAPL' or 'user:123')
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
function emitToRoom(room, event, data) {
  if (!socketIO) {
    console.warn('⚠️  Socket.IO not initialized, cannot emit event');
    return;
  }

  try {
    socketIO.to(room).emit(event, data);
    console.log(`📡 Emitted '${event}' to room '${room}'`);
  } catch (error) {
    console.error('Socket emit error:', error);
  }
}

/**
 * Emit event to user
 */
function emitToUser(userId, event, data) {
  const room = `user:${userId}`;
  emitToRoom(room, event, data);
}

/**
 * Emit event to symbol subscribers
 */
function emitToSymbol(symbol, event, data) {
  const room = `symbol:${symbol.toUpperCase()}`;
  emitToRoom(room, event, data);
}

/**
 * Broadcast to all clients
 */
function broadcast(event, data) {
  if (!socketIO) {
    console.warn('⚠️  Socket.IO not initialized, cannot broadcast');
    return;
  }

  try {
    socketIO.emit(event, data);
    console.log(`📡 Broadcasted '${event}' to all clients`);
  } catch (error) {
    console.error('Socket broadcast error:', error);
  }
}

module.exports = {
  setIO,
  getIO,
  emitToRoom,
  emitToUser,
  emitToSymbol,
  broadcast,
};
