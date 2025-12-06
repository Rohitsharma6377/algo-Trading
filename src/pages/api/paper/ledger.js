
import connectDB from '../../../lib/db';
import Trade from '../../../models/Trade';
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

    const { status, limit = 50, skip = 0 } = req.query;

    const query = {
      userId: user._id,
      type: 'paper',
    };

    if (status) {
      query.status = status;
    }

    const trades = await Trade.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Trade.countDocuments(query);

    // Calculate summary stats
    const closedTrades = await Trade.find({
      userId: user._id,
      type: 'paper',
      status: 'closed',
    }).lean();

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl <= 0);
    const winRate = closedTrades.length > 0
      ? (winningTrades.length / closedTrades.length) * 100
      : 0;

    res.status(200).json({
      success: true,
      trades: trades.map(t => ({
        id: t._id,
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        entryDate: t.entryDate,
        exitDate: t.exitDate,
        status: t.status,
        pnl: t.pnl,
        pnlPercent: t.pnlPercent,
        commission: t.commission,
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit)),
      },
      summary: {
        totalTrades: closedTrades.length,
        totalPnl: totalPnl.toFixed(2),
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: winRate.toFixed(2) + '%',
      },
    });
  } catch (error) {
    console.error('Get ledger error:', error);
    res.status(500).json({
      error: 'Failed to fetch ledger',
      message: error.message,
    });
  }
}
