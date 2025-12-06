const mongoose = require('mongoose');

/**
 * Prediction model
 * Stores ML predictions for symbols
 */
const PredictionSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    modelVersion: String,
    prediction: {
      type: String,
      enum: ['BUY', 'SELL', 'HOLD'],
      required: true,
    },
    probabilities: {
      buy: Number,
      sell: Number,
      hold: Number,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    reliability: {
      type: String,
      enum: ['high', 'medium', 'low'],
    },
    targetPrice: Number,
    stopLoss: Number,
    timeHorizon: {
      type: String,
      enum: ['intraday', 'swing', 'positional'],
      default: 'swing',
    },
    suggestedWindow: {
      start: Date,
      end: Date,
    },
    features: {
      type: Map,
      of: Number,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

PredictionSchema.index({ symbol: 1, date: -1 });
PredictionSchema.index({ prediction: 1, confidence: -1 });

module.exports = mongoose.models.Prediction || mongoose.model('Prediction', PredictionSchema);
