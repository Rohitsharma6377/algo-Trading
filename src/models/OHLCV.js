const mongoose = require('mongoose');

/**
 * OHLCV (Open, High, Low, Close, Volume) data model
 * Stores historical market data for backtesting and training
 */
const OHLCVSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    open: {
      type: Number,
      required: true,
    },
    high: {
      type: Number,
      required: true,
    },
    low: {
      type: Number,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
    volume: {
      type: Number,
      required: true,
      default: 0,
    },
    adjClose: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
OHLCVSchema.index({ symbol: 1, date: -1 });
OHLCVSchema.index({ symbol: 1, date: 1 });

module.exports = mongoose.models.OHLCV || mongoose.model('OHLCV', OHLCVSchema);
