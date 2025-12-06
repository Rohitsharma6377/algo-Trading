
import mongoose from 'mongoose';

const OHLCSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
    },
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
});

// Compound index for efficient querying by symbol and date
OHLCSchema.index({ symbol: 1, date: -1 });

export default mongoose.models.OHLC || mongoose.model('OHLC', OHLCSchema);
