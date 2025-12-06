
import { predictSymbol } from '../../../lib/predictor';
import { runAutoTrade } from '../../../lib/tradeEngine';
import { verifyToken } from '../../../lib/auth';

// Optional: if utilizing socket updates
// import { getSocket } from ...

export default async function handler(req, res) {
  const { symbol } = req.query;
  const { auth_token } = req.cookies;

  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  // Auth is optional for public prediction but required for auto-trade
  let userId = null;
  if (auth_token) {
    const payload = verifyToken(auth_token);
    if (payload) userId = payload.userId;
  }

  try {
    const result = await predictSymbol(symbol);

    // Auto Trade Trigger
    if (userId && result.prediction && result.confidence) {
      // We pass formatted prediction object matching tradeEngine expectation
      // tradeEngine expects: { symbol, prediction: 'UP', reliability: 0.8 }
      // Our predictor returns: { symbol, prediction: 'UP', confidence: 0.8 }
      // Let's adapt
      runAutoTrade(userId, {
        symbol: result.symbol,
        prediction: result.prediction,
        reliability: result.confidence
      });
    }

    res.status(200).json(result);

    // Emit socket update if possible?
    if (res.socket.server.io) {
      res.socket.server.io.to(symbol.toUpperCase()).emit('prediction_update', result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
