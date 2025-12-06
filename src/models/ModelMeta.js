const mongoose = require('mongoose');

/**
 * Model metadata storage
 * Tracks trained ML models and their performance metrics
 */
const ModelMetaSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    modelVersion: {
      type: String,
      required: true,
    },
    modelType: {
      type: String,
      enum: ['MLP', 'LSTM', 'GRU', 'CNN'],
      default: 'MLP',
    },
    modelPath: {
      type: String,
      required: true,
    },
    trainingDate: {
      type: Date,
      default: Date.now,
    },
    trainingDataRange: {
      start: Date,
      end: Date,
    },
    features: [String],
    scalerParams: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    metrics: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1Score: Number,
      loss: Number,
      valLoss: Number,
    },
    hyperparameters: {
      epochs: Number,
      batchSize: Number,
      learningRate: Number,
      layers: [mongoose.Schema.Types.Mixed],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    trainedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active models
ModelMetaSchema.index({ symbol: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.models.ModelMeta || mongoose.model('ModelMeta', ModelMetaSchema);
