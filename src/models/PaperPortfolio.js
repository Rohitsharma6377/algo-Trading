const mongoose = require('mongoose');

/**
 * Paper trading portfolio snapshot
 * Tracks portfolio equity over time
 */
const PaperPortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    cash: {
      type: Number,
      required: true,
      default: 100000, // Initial capital from env
    },
    equity: {
      type: Number,
      required: true,
      default: 100000,
    },
    positions: [
      {
        symbol: String,
        quantity: Number,
        avgPrice: Number,
        currentPrice: Number,
        unrealizedPnl: Number,
      },
    ],
    realizedPnl: {
      type: Number,
      default: 0,
    },
    unrealizedPnl: {
      type: Number,
      default: 0,
    },
    totalPnl: {
      type: Number,
      default: 0,
    },
    totalReturn: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

PaperPortfolioSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.models.PaperPortfolio || mongoose.model('PaperPortfolio', PaperPortfolioSchema);
