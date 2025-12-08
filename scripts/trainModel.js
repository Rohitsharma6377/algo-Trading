/**
 * Train model script
 * Usage: node scripts/trainModel.js SYMBOL
 * Example: node scripts/trainModel.js RELIANCE.NS
 */

require('dotenv').config();
const mongoose = require('mongoose');
const OHLCV = require('../src/models/OHLCV');
const ModelMeta = require('../src/models/ModelMeta');
const { calculateIndicators } = require('../src/lib/indicators');
const { createTrainingSet, normalizeFeatures } = require('../src/lib/features');
const { trainModel, saveModel } = require('../src/lib/mlModel');

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

    if (!ohlcvData || ohlcvData.length < 50) {
      console.error(`❌ Insufficient data (need 50+, have ${ohlcvData?.length || 0})`);
      process.exit(1);
    }

    console.log(`📊 Training data: ${ohlcvData.length} bars`);

    // Calculate indicators
    console.log('Calculating indicators...');
    const indicators = calculateIndicators(ohlcvData);
    console.log('Indicators calculated.');

    // Fetch News Sentiment
    console.log('Fetching sentiment data...');
    const NewsSentiment = require('../src/models/NewsSentiment');
    const sentimentData = await NewsSentiment.find({ symbol: symbol.toUpperCase() });

    const sentimentMap = {};
    sentimentData.forEach(item => {
      sentimentMap[item.date.toDateString()] = item.sentimentScore;
    });
    console.log(`Found ${sentimentData.length} sentiment records.`);

    // Create Training Set (features + labels)
    console.log('Creating training set...');

    // createTrainingSet returns { inputs, outputs, dates }
    // inputs are raw features (not normalized)
    // outputs are one-hot labels
    // We pass sentimentMap as 2nd arg
    const { inputs: allFeatures, outputs: labels } = createTrainingSet(indicators, sentimentMap);

    console.log(`✨ Extracted ${allFeatures.length} feature vectors`);

    if (allFeatures.length === 0) {
      console.error("❌ No features extracted. Check indicator calculation.");
      process.exit(1);
    }

    // Normalize
    const { normalized, scaler } = normalizeFeatures(allFeatures);

    console.log('Starting training...');

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
      'bbPosition', 'bbWidth', 'atr', 'momentum', 'volatility', 'sentiment'
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
