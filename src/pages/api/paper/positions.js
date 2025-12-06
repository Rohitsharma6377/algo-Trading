
import connectDB from '../../../lib/db';
import Trade from '../../../models/Trade';
import PaperPortfolio from '../../../models/PaperPortfolio';
import User from '../../../models/User';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { auth_token } = req.cookies;
    const payload = verifyToken(auth_token);

    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get latest portfolio
    const portfolio = await PaperPortfolio.findOne({ userId: user._id })
      .sort({ date: -1 })
      .lean();

    if (!portfolio) {
      return res.status(200).json({
        success: true,
        positions: [],
        equity: 100000,
        cash: 100000,
        totalPnl: 0,
        equityCurve: [],
      });
    }

    // Get open trades
    const openTrades = await Trade.find({
      userId: user._id,
      type: 'paper',
      status: 'open',
    }).lean();

    // Get equity curve (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const equityCurve = await PaperPortfolio.find({
      userId: user._id,
      date: { $gte: thirtyDaysAgo },
    })
      .select('date equity cash')
      .sort({ date: 1 })
      .lean();

    const initialCapital = parseFloat(process.env.PAPER_INITIAL_CAPITAL) || 100000;
    const totalReturn = ((portfolio.equity - initialCapital) / initialCapital) * 100;

    res.status(200).json({
      success: true,
      portfolio: {
        equity: portfolio.equity.toFixed(2),
        cash: portfolio.cash.toFixed(2),
        totalReturn: totalReturn.toFixed(2) + '%',
        realizedPnl: (portfolio.realizedPnl || 0).toFixed(2),
        unrealizedPnl: (portfolio.unrealizedPnl || 0).toFixed(2),
      },
      positions: portfolio.positions.map(p => ({
        symbol: p.symbol,
        quantity: p.quantity,
        avgPrice: p.avgPrice.toFixed(2),
        currentPrice: p.currentPrice.toFixed(2),
        unrealizedPnl: (p.unrealizedPnl || 0).toFixed(2),
        value: (p.quantity * p.currentPrice).toFixed(2),
      })),
      openTrades: openTrades.map(t => ({
        id: t._id,
        symbol: t.symbol,
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        entryDate: t.entryDate,
        stopLoss: t.stopLoss,
        takeProfit: t.takeProfit,
      })),
      equityCurve: equityCurve.map(e => ({
        date: e.date.toISOString(),
        equity: e.equity,
        cash: e.cash,
      })),
    });
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({
      error: 'Failed to fetch positions',
      message: error.message,
    });
  }
}
