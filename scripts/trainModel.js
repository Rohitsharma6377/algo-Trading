/**
 * Train model script
 * Usage: node scripts/trainModel.js SYMBOL
 * Example: node scripts/trainModel.js RELIANCE.NS
 */

require('dotenv').config();
const mongoose = require('mongoose');
const OHLCV = require('../models/OHLCV');
const ModelMeta = require('../models/ModelMeta');
const { calculateIndicators, extractFeatures, generateLabels, normalizeFeatures } = require('../lib/indicators');
const { trainModel, saveModel } = require('../lib/mlModel');

async function train(symbol) {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not defined in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log(`🤖 Training model for ${symbol}...`);

    // Fetch data
    const ohlcvData = await OHLCV.find({ symbol: symbol.toUpperCase() })
      .sort({ date: 1 })
      .lean();

    if (!ohlcvData || ohlcvData.length < 300) {
      console.error(`❌ Insufficient data (need 300+, have ${ohlcvData?.length || 0})`);
      process.exit(1);
    }

    console.log(`📊 Training data: ${ohlcvData.length} bars`);

    // Calculate indicators
    const indicators = calculateIndicators(ohlcvData);

    // Extract features
    const allFeatures = [];
    for (let i = 200; i < ohlcvData.length - 5; i++) {
      const features = extractFeatures(ohlcvData, indicators, i);
      allFeatures.push(features);
    }

    // Generate labels
    const labels = generateLabels(ohlcvData.slice(200, -5));

    console.log(`✨ Extracted ${allFeatures.length} feature vectors`);

    // Normalize
    const { normalized, scaler } = normalizeFeatures(allFeatures);

    // Train
    const { model, metrics } = await trainModel(normalized, labels, {
      modelType: 'MLP',
      epochs: 50,
      batchSize: 32,
    });

    // Save model
    const featureNames = [
      'returns', 'hlRatio', 'closePosition', 'volumeChange',
      'sma20Ratio', 'sma50Ratio', 'sma200Ratio', 'rsi',
      'macd', 'macdSignal', 'macdHistogram',
      'bbPosition', 'bbWidth', 'atr', 'momentum', 'volatility',
    ];

    const metadata = {
      symbol: symbol.toUpperCase(),
      modelType: 'MLP',
      trainingDate: new Date(),
      trainingDataRange: {
        start: ohlcvData[0].date,
        end: ohlcvData[ohlcvData.length - 1].date,
      },
      features: featureNames,
      scalerParams: scaler,
      metrics,
    };

    const { modelPath, modelVersion } = await saveModel(model, symbol.toUpperCase(), metadata);

    // Save to database
    await ModelMeta.create({
      symbol: symbol.toUpperCase(),
      modelVersion,
      modelType: 'MLP',
      modelPath,
      trainingDate: new Date(),
      trainingDataRange: metadata.trainingDataRange,
      features: featureNames,
      scalerParams: scaler,
      metrics,
      isActive: true,
    });

    // Deactivate old models
    await ModelMeta.updateMany(
      {
        symbol: symbol.toUpperCase(),
        modelVersion: { $ne: modelVersion },
      },
      { $set: { isActive: false } }
    );

    console.log('✅ Training completed');
    console.log(`Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`Val Accuracy: ${(metrics.valAccuracy * 100).toFixed(2)}%`);
    console.log(`Model saved to: ${modelPath}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Training error:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const symbol = args[0];

if (!symbol) {
  console.error('❌ Usage: node scripts/trainModel.js SYMBOL');
  console.error('Example: node scripts/trainModel.js RELIANCE.NS');
  process.exit(1);
}

train(symbol);
