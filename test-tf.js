
try {
    const tf = require('@tensorflow/tfjs-node');
    console.log('TFJS Loaded successfully. Version:', tf.version.tfjs);
} catch (e) {
    console.error('TFJS Load Failed:', e);
}
