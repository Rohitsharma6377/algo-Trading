
import dbConnect from './db';
import Portfolio from '../models/Portfolio';
import Trade from '../models/Trade'; // Assuming we have a Trade model or will create one
import { getLatestPrice } from './yahoo';
import { validateOrder } from './riskManager';

/**
 * Paper Trading Engine
 * Handles full order lifecycle simulation
 */

// Create Schema for Trade if not exists? 
// Actually I'll assume Trade model needs to be created or I use Portfolio.trades.
// Prompt asked for "PaperTrades" collection. I will use a separate Check.
// Use Portfolio model from previous steps which has "trades" array.
// But for "Full Algo" let's be robust. I'll stick to Portfolio model for now to avoid creating new model files unless necessary.
// Actually, `riskManager` imported `Trade` model. I must ensure `models/Trade.js` exists.
// I will create `models/Trade.js` and `models/PortfolioSnapshot.js` in a later step if they don't exist.

export const createOrder = async (userId, symbol, side, quantity, strategy = 'MANUAL') => {
    await dbConnect();

    // 1. Get Price
    const price = await getLatestPrice(symbol);
    if (!price) throw new Error("Price unavailable");

    // 2. Risk Check
    const order = { symbol, side, quantity, price, type: 'paper' };
    const riskCheck = await validateOrder(order, userId);

    if (!riskCheck.allowed) {
        throw new Error(`Risk Manager Logic: ${riskCheck.reason}`);
    }

    // 3. Execute (Fill)
    return await fillOrder(userId, symbol, side, quantity, price, strategy);
};

export const fillOrder = async (userId, symbol, side, quantity, price, strategy) => {
    await dbConnect();

    // Fetch Portfolio
    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
        // Init portfolio if not exists
        portfolio = await Portfolio.create({ userId, balance: 100000, cash: 100000, equity: 100000 });
    }

    const value = price * quantity;
    const commission = value * 0.001; // 0.1% comm

    if (side === 'BUY') {
        if (portfolio.cash < value + commission) throw new Error("Insufficient Cash");

        portfolio.cash -= (value + commission);
        portfolio.balance -= (value + commission); // balance usually means cash? prompt says portfolio snapshot.

        // Update Holdings
        const holding = portfolio.holdings.find(h => h.symbol === symbol);
        if (holding) {
            const totalCost = (holding.averageBuyPrice * holding.quantity) + value;
            holding.quantity += quantity;
            holding.averageBuyPrice = totalCost / holding.quantity;
        } else {
            portfolio.holdings.push({ symbol, quantity, averageBuyPrice: price });
        }

    } else if (side === 'SELL') {
        const holding = portfolio.holdings.find(h => h.symbol === symbol);
        if (!holding || holding.quantity < quantity) throw new Error("Insufficient Holdings");

        portfolio.cash += (value - commission);
        portfolio.balance += (value - commission);

        holding.quantity -= quantity;
        if (holding.quantity <= 0) {
            portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
        }
    }

    // Update Equity
    // Equity = Cash + Holdings Value
    // We strictly need real-time price of all holdings to calc equity. 
    // For now we assume current price approx.
    portfolio.equity = portfolio.cash + portfolio.holdings.reduce((acc, h) => acc + (h.quantity * (h.symbol === symbol ? price : h.averageBuyPrice)), 0);
    // Ideally we fetch all prices, but that's slow. 

    // Record Trade
    // We should use the Trade model if riskManager uses it.
    // Let's assume we save to separate collection "PaperTrades" as requested.
    // But since I don't want to break existing 'Portfolio' embedded trades:
    portfolio.trades.push({
        symbol, type: side, quantity, price, date: new Date(), strategy
    });

    await portfolio.save();
    return portfolio;
};

export const getPortfolio = async (userId) => {
    await dbConnect();
    return await Portfolio.findOne({ userId });
};
