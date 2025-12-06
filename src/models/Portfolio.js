
import mongoose from 'mongoose';

const TradeSchema = new mongoose.Schema({
    symbol: String,
    type: { type: String, enum: ['BUY', 'SELL'] },
    quantity: Number,
    price: Number,
    date: { type: Date, default: Date.now },
});

const PortfolioSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    balance: { type: Number, default: 100000 }, // Start with $100k paper money
    holdings: [{
        symbol: String,
        quantity: Number,
        averageBuyPrice: Number,
    }],
    trades: [TradeSchema],
    isAutoTrading: { type: Boolean, default: false },
});

export default mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
