
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');
const { logTraining, logError } = require('./utils/logger'); // Assuming this exists or we mock it

const modelCache = new Map();

/**
 * Create MLP Model matching user specs:
 * Dense(128) -> Dense(64) -> Dense(32) -> Dense(3, softmax)
 */
function createMLPModel(inputShape) {
  const model = tf.sequential();

  model.add(tf.layers.dense({
    inputShape: [inputShape],
    units: 128,
    activation: 'relu',
    kernelInitializer: 'heNormal',
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    kernelInitializer: 'heNormal',
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelInitializer: 'heNormal',
  }));

  model.add(tf.layers.dense({
    units: 3,
    activation: 'softmax',
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

/**
 * Train model
 */
async function trainModel(features, labels, options = {}) {
  const { epochs = 50, batchSize = 32 } = options;

  const xTrain = tf.tensor2d(features);
  const yTrain = tf.tensor2d(labels); // labels are one-hot encoded already from features.js

  const inputShape = features[0].length;
  const model = createMLPModel(inputShape);

  console.log(`🤖 Training MLP: ${inputShape} inputs, ${features.length} samples`);

  const history = await model.fit(xTrain, yTrain, {
    epochs,
    batchSize,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 10 === 0) console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)} acc=${logs.acc.toFixed(4)}`);
      }
    }
  });

  xTrain.dispose();
  yTrain.dispose();

  return { model, history: history.history };
}

/**
 * Save Model
 */
async function saveModel(model, symbol) {
  const dir = path.join(process.cwd(), 'models_tf', symbol.toUpperCase());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await model.save(`file://${dir}`);
  console.log(`✅ Model saved for ${symbol}`);
}

/**
 * Load Model
 */
async function loadModel(symbol) {
  const sym = symbol.toUpperCase();
  if (modelCache.has(sym)) return modelCache.get(sym);

  const dir = path.join(process.cwd(), 'models_tf', sym, 'model.json');
  if (!fs.existsSync(dir)) return null;

  try {
    const model = await tf.loadLayersModel(`file://${dir}`);
    modelCache.set(sym, model);
    return model;
  } catch (e) {
    console.error("Load model error:", e);
    return null;
  }
}

/**
 * Predict
 */
function predict(model, featureVector) {
  return tf.tidy(() => {
    const input = tf.tensor2d([featureVector]);
    const output = model.predict(input);
    const probs = output.dataSync();
    return Array.from(probs);
  });
}

module.exports = {
  createMLPModel,
  trainModel,
  saveModel,
  loadModel,
  predict
};
