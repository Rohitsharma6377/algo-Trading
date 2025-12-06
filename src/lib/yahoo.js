
import yahooFinance from 'yahoo-finance2';
import dbConnect from './db';
import OHLC from '../models/OHLC';

/**
 * Validates and normalizes symbol
 */
const cleanSymbol = (sym) => sym.toUpperCase().trim();

/**
 * Fetch historical data (Daily) and save to DB
 */
export const fetchAndSaveStock = async (symbol) => {
    await dbConnect();
    const cleanSym = cleanSymbol(symbol);

    // Fetch up to 5 years by default if needed, or from 2020 as previously set
    const queryOptions = { period1: '2020-01-01', interval: '1d' };

    try {
        const results = await yahooFinance.historical(cleanSym, queryOptions);

        if (!results || results.length === 0) {
            throw new Error(`No data found for ${cleanSym}`);
        }

        const operations = results.map((data) => ({
            updateOne: {
                filter: { symbol: cleanSym, date: data.date },
                update: {
                    $set: {
                        symbol: cleanSym,
                        date: data.date,
                        open: data.open,
                        high: data.high,
                        low: data.low,
                        close: data.close,
                        volume: data.volume,
                    },
                },
                upsert: true,
            },
        }));

        await OHLC.bulkWrite(operations);
        return { success: true, count: results.length };
    } catch (error) {
        console.error('Yahoo Fetch Error:', error);
        throw error;
    }
};

/**
 * Get Intraday Data (1m, 5m, 15m)
 * Note: Yahoo Public API has limits on how far back 1m data goes (usually 7 days).
 */
export const getIntradayData = async (symbol, interval = '1m') => {
    const cleanSym = cleanSymbol(symbol);
    try {
        // query for last 7 days to be safe for 1m
        const period1 = new Date();
        period1.setDate(period1.getDate() - 5);

        const results = await yahooFinance.historical(cleanSym, {
            period1: period1.toISOString(),
            interval: interval
        });
        return results;
    } catch (error) {
        console.error('Yahoo Intraday Error:', error);
        return [];
    }
};

/**
 * Get Company Info and Fundamentals
 */
export const getCompanyInfo = async (symbol) => {
    const cleanSym = cleanSymbol(symbol);
    try {
        const quoteSummary = await yahooFinance.quoteSummary(cleanSym, {
            modules: ['price', 'summaryProfile', 'financialData', 'defaultKeyStatistics']
        });
        return quoteSummary;
    } catch (error) {
        console.error('Yahoo Fundamentals Error:', error);
        return null;
    }
};

/**
 * Get Real-time Quote
 */
export const getLatestPrice = async (symbol) => {
    try {
        const quote = await yahooFinance.quote(cleanSymbol(symbol));
        return quote.regularMarketPrice;
    } catch (error) {
        console.error('Yahoo Quote Error:', error);
        return null;
    }
};
