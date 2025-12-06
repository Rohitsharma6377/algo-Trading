const mongoose = require('mongoose');

/**
 * Trade record model
 * Stores both paper and live trades
 */
const TradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['paper', 'live'],
      default: 'paper',
      index: true,
    },
    side: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    exitPrice: {
      type: Number,
    },
    entryDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    exitDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'cancelled'],
      default: 'open',
      index: true,
    },
    pnl: {
      type: Number,
      default: 0,
    },
    pnlPercent: {
      type: Number,
      default: 0,
    },
    commission: {
      type: Number,
      default: 0,
    },
    stopLoss: Number,
    takeProfit: Number,
    strategy: String,
    broker: {
      type: String,
      enum: ['paper', 'zerodha', 'upstox'],
      default: 'paper',
    },
    orderId: String, // Broker order ID
    notes: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
TradeSchema.index({ userId: 1, createdAt: -1 });
TradeSchema.index({ symbol: 1, status: 1 });
TradeSchema.index({ type: 1, status: 1 });

module.exports = mongoose.models.Trade || mongoose.model('Trade', TradeSchema);
