
const fs = require('fs');
const path = require('path');

// --- robust-tf-loader ---
let tf;
let useNodeBackend = false;

try {
  // Try loading the C++ binding
  tf = require('@tensorflow/tfjs-node');
  useNodeBackend = true;
  console.log('✅ Loaded @tensorflow/tfjs-node');
} catch (e) {
  console.warn('⚠️ Failed to load @tensorflow/tfjs-node (Native binding missing or failed). Falling back to pure JS version.');
  console.warn('   Error details:', e.message);
  try {
    tf = require('@tensorflow/tfjs');
    console.log('✅ Loaded @tensorflow/tfjs (CPU)');
  } catch (e2) {
    console.error('❌ Failed to load @tensorflow/tfjs. ML features will not work.');
    throw e2;
  }
}

// --- Custom File IO Helper for Pure JS Fallback ---
class NodeFilesystemIO {
  constructor(path) {
    this.path = path; // Directory path
  }

  async save(modelArtifacts) {
    if (!fs.existsSync(this.path)) fs.mkdirSync(this.path, { recursive: true });

    // 1. Save model.json
    const modelJSON = {
      modelTopology: modelArtifacts.modelTopology,
      format: modelArtifacts.format,
      generatedBy: modelArtifacts.generatedBy,
      convertedBy: modelArtifacts.convertedBy,
      weightsManifest: [{
        paths: ['./weights.bin'],
        weights: modelArtifacts.weightSpecs
      }]
    };
    fs.writeFileSync(path.join(this.path, 'model.json'), JSON.stringify(modelJSON));

    // 2. Save weights.bin
    if (modelArtifacts.weightData) {
      const buffer = Buffer.from(modelArtifacts.weightData);
      fs.writeFileSync(path.join(this.path, 'weights.bin'), buffer);
    }

    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
        weightDataBytes: modelArtifacts.weightData ? modelArtifacts.weightData.byteLength : 0
      }
    };
  }

  async load() {
    const jsonPath = path.join(this.path, 'model.json');
    const weightsPath = path.join(this.path, 'weights.bin');

    const modelJSON = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Load weights if they exist
    let weightData = null;
    if (fs.existsSync(weightsPath)) {
      weightData = fs.readFileSync(weightsPath).buffer;
      // Note: Node Buffer to ArrayBuffer
      weightData = weightData.slice(weightData.byteOffset, weightData.byteOffset + weightData.byteLength);
    }

    return {
      modelTopology: modelJSON.modelTopology,
      format: modelJSON.format,
      generatedBy: modelJSON.generatedBy,
      convertedBy: modelJSON.convertedBy,
      weightSpecs: modelJSON.weightsManifest[0].weights,
      weightData: weightData
    };
  }
}

// --- imports ---
// const { logTraining, logError } = require('./utils/logger'); 

const modelCache = new Map();

/**
 * Create MLP Model matching user specs
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
  const yTrain = tf.tensor2d(labels);

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

  console.log(`Saving model to: ${dir}`);

  if (useNodeBackend) {
    // Native save
    await model.save(`file://${dir}`);
  } else {
    // Custom save
    const io = new NodeFilesystemIO(dir);
    await model.save(io);
  }

  console.log(`✅ Model saved for ${symbol}`);
}

/**
 * Load Model
 */
async function loadModel(symbol) {
  const sym = symbol.toUpperCase();
  if (modelCache.has(sym)) return modelCache.get(sym);

  const dir = path.join(process.cwd(), 'models_tf', sym);
  // tfjs-node expects the folder or model.json path usually? 
  // actually file:// scheme for save takes a dir. loadLayersModel takes model.json
  const modelJsonPath = path.join(dir, 'model.json');

  if (!fs.existsSync(modelJsonPath)) return null;

  try {
    let model;
    if (useNodeBackend) {
      model = await tf.loadLayersModel(`file://${modelJsonPath}`);
    } else {
      const io = new NodeFilesystemIO(dir);
      model = await tf.loadLayersModel(io);
    }

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

// Re-export tf for other modules to use safely?
// Maybe not needed if they import from here or predictor
// But predictor imports from here. 

module.exports = {
  createMLPModel,
  trainModel,
  saveModel,
  loadModel,
  predict,
  tf // Exporting safe TF instance
};
