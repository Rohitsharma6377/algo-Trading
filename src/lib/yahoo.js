
import yahooFinance from 'yahoo-finance2';
import dbConnect from './db';
import OHLC from '../models/OHLCV'; // Switched to OHLCV to match scripts
import NewsSentiment from '../models/NewsSentiment';

/**
 * Validates and normalizes symbol
 */
const cleanSymbol = (sym) => sym.toUpperCase().trim();

/**
 * Simple Sentiment Analysis Helper
 * Same logic as scripts/fetchNews.js for consistency
 */
const sentimentDict = {
    'breakthrough': 3, 'growth': 2, 'record': 2, 'up': 1, 'rise': 1, 'bull': 2, 'positive': 2,
    'beat': 2, 'profit': 2, 'gain': 2, 'high': 1, 'surge': 3, 'jump': 2, 'buy': 2,
    'strong': 2, 'success': 2, 'partnership': 1, 'launch': 1, 'win': 2, 'award': 1,
    'down': -1, 'fall': -1, 'drop': -1, 'bear': -2, 'negative': -2, 'loss': -2,
    'miss': -2, 'fail': -2, 'weak': -2, 'crash': -3, 'decline': -1, 'sell': -2,
    'plunge': -3, 'concern': -1, 'risk': -1, 'lawsuit': -2, 'ban': -2, 'debt': -1,
    'crisis': -3, 'inflation': -1, 'recession': -2, 'warning': -1
};

const analyzeSentiment = (text) => {
    if (!text) return 0;
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    let count = 0;
    words.forEach(w => {
        if (sentimentDict[w]) {
            score += sentimentDict[w];
            count++;
        }
    });
    if (count === 0) return 0;
    return Math.max(-1, Math.min(1, score / Math.max(1, count)));
};

/**
 * Fetch News and perform Sentiment Analysis
 */
export const fetchAndSaveNews = async (symbol) => {
    const cleanSym = cleanSymbol(symbol);
    try {
        const result = await yahooFinance.search(cleanSym, { newsCount: 15 });
        if (!result.news || result.news.length === 0) return 0;

        let insertedCount = 0;
        for (const item of result.news) {
            const date = new Date(item.providerPublishTime * 1000);
            const score = analyzeSentiment(item.title);

            await NewsSentiment.findOneAndUpdate(
                { symbol: cleanSym, date: date },
                {
                    title: item.title,
                    link: item.link,
                    source: item.publisher,
                    sentimentScore: score
                },
                { upsert: true, new: true }
            );
            insertedCount++;
        }
        console.log(`📰 Processed ${insertedCount} news items for ${cleanSym}`);
        return insertedCount;
    } catch (e) {
        console.error('News Fetch Error:', e);
        return 0;
    }
};

/**
 * Fetch historical data (Daily) and save to DB
 */
export const fetchAndSaveStock = async (symbol) => {
    await dbConnect();
    const cleanSym = cleanSymbol(symbol);

    console.log(`Fetching Data & News for ${cleanSym}...`);

    // Fetch News concurrently
    fetchAndSaveNews(cleanSym).catch(e => console.error("News fetch background error:", e));

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
                        adjClose: data.adjClose || data.close
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
            modules: ['price', 'summaryProfile', 'financialData', 'defaultKeyStatistics', 'recommendationTrend', 'earnings']
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
/**
 * Get Real-time Quote
 */
export const getLatestPrice = async (symbol) => {
    try {
        const quote = await yahooFinance.quote(cleanSymbol(symbol));
        if (!quote) return null;
        return quote.regularMarketPrice;
    } catch (error) {
        console.error('Yahoo Quote Error:', error);
        return null;
    }
};

/**
 * Get Trending Stocks (India)
 */
export const getTrendingStocks = async (region = 'IN') => {
    try {
        // 'IN' for India
        const result = await yahooFinance.trending(region);
        if (result && result.quotes) {
            // result.quotes contains metadata, usually just symbols and some info
            // We might need to fetch full quotes for them to get price/%change
            const symbols = result.quotes.map(q => q.symbol).slice(0, 5);
            const quotes = await yahooFinance.quote(symbols);
            return quotes; // Array of quote objects
        }
        return [];
    } catch (error) {
        console.error('Yahoo Trending Error:', error);
        return [];
    }
}

/**
 * Get General Market News
 */
export const getMarketNews = async (query = 'Indian Stock Market') => {
    try {
        const result = await yahooFinance.search(query, { newsCount: 10 });
        const news = result.news || [];
        // Add sentiment
        return news.map(item => ({
            ...item,
            sentimentScore: analyzeSentiment(item.title)
        }));
    } catch (error) {
        console.error('Yahoo Market News Error:', error);
        return [];
    }
}
