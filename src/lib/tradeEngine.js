
import dbConnect from './db';
import Portfolio from '../models/Portfolio';
import { getLatestPrice } from './yahoo';

export const executeTrade = async (userId, symbol, type, quantity) => {
    await dbConnect();

    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
        portfolio = await Portfolio.create({ userId });
    }

    const price = await getLatestPrice(symbol);
    if (!price) throw new Error('Could not fetch price');

    if (type === 'BUY') {
        const cost = price * quantity;
        if (portfolio.balance < cost) throw new Error('Insufficient funds');

        portfolio.balance -= cost;

        const holding = portfolio.holdings.find(h => h.symbol === symbol);
        if (holding) {
            const totalCost = (holding.averageBuyPrice * holding.quantity) + cost;
            holding.quantity += quantity;
            holding.averageBuyPrice = totalCost / holding.quantity;
        } else {
            portfolio.holdings.push({ symbol, quantity, averageBuyPrice: price });
        }
    } else if (type === 'SELL') {
        const holding = portfolio.holdings.find(h => h.symbol === symbol);
        if (!holding || holding.quantity < quantity) throw new Error('Insufficient holdings');

        const revenue = price * quantity;
        portfolio.balance += revenue;

        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
        }
    }

    portfolio.trades.push({ symbol, type, quantity, price });
    await portfolio.save();

    return portfolio;
};

export const runAutoTrade = async (userId, prediction) => {
    const { symbol, prediction: signal, reliability } = prediction;

    // Simple Logic:
    // BUY if UP and Reliability > 70%
    // SELL if DOWN and Reliability > 70% (and we have holdings)

    if (reliability < 0.7) return null; // Too risky

    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio || !portfolio.isAutoTrading) return null; // Auto trade off

    try {
        if (signal === 'UP') {
            // Buy $1000 worth or max balance
            const price = await getLatestPrice(symbol);
            const quantity = Math.floor(Math.min(1000, portfolio.balance) / price);
            if (quantity > 0) {
                return await executeTrade(userId, symbol, 'BUY', quantity);
            }
        } else if (signal === 'DOWN') {
            // Sell all holdings of this symbol
            const holding = portfolio.holdings.find(h => h.symbol === symbol);
            if (holding) {
                return await executeTrade(userId, symbol, 'SELL', holding.quantity);
            }
        }
    } catch (e) {
        console.error(`Auto trade failed for ${symbol}:`, e);
    }
    return null;
};
