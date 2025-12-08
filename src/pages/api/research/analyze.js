
import { getCompanyInfo, getLatestPrice } from '../../../lib/yahoo';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    // Validate symbol format (basic check)
    const cleanSym = symbol.trim().toUpperCase();
    if (cleanSym.length < 2) {
        return res.status(400).json({
            error: 'Invalid symbol format',
            message: 'Please use the autocomplete dropdown to select a valid stock symbol (e.g., RELIANCE.NS, TCS.NS)'
        });
    }

    try {
        // Fetch comprehensive data
        const [info, quote, historical] = await Promise.all([
            getCompanyInfo(cleanSym),
            yahooFinance.quote(cleanSym),
            yahooFinance.historical(cleanSym, {
                period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                interval: '1d'
            }).catch(() => [])
        ]);

        if (!info || !info.price || !quote) {
            return res.status(404).json({
                error: 'Stock not found',
                message: `No data available for symbol "${cleanSym}". Please verify the symbol and try again.`
            });
        }

        const financials = info.financialData || {};
        const keyStats = info.defaultKeyStatistics || {};
        const summary = info.summaryProfile || {};
        const price = quote.regularMarketPrice || 0;

        // --- TECHNICAL ANALYSIS ---
        const technicalScore = calculateTechnicalScore(quote, historical);

        // --- FUNDAMENTAL ANALYSIS ---
        const fundamentalScore = calculateFundamentalScore(financials, keyStats);

        // --- AI INVESTMENT RECOMMENDATION ---
        const recommendation = generateRecommendation(technicalScore, fundamentalScore, financials, keyStats, quote);

        // --- PROS & CONS ---
        const { pros, cons } = generateProsAndCons(financials, keyStats, summary, quote);

        // --- PEER COMPARISON ---
        const peers = getPeerStocks(summary.sector, cleanSym);

        // --- MARKET CONTEXT ---
        const marketContext = {
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            percentFromHigh: ((price - quote.fiftyTwoWeekHigh) / quote.fiftyTwoWeekHigh * 100).toFixed(2),
            percentFromLow: ((price - quote.fiftyTwoWeekLow) / quote.fiftyTwoWeekLow * 100).toFixed(2),
            avgVolume: quote.averageDailyVolume3Month,
            marketCap: quote.marketCap,
            beta: keyStats.beta || 1
        };

        // Construct Response
        const responseData = {
            symbol: cleanSym,
            price: price,
            priceChange: quote.regularMarketChange,
            priceChangePercent: quote.regularMarketChangePercent,

            profile: {
                name: quote.longName || quote.shortName || cleanSym,
                sector: summary.sector || 'N/A',
                industry: summary.industry || 'N/A',
                description: summary.longBusinessSummary || 'No description available.',
                website: summary.website,
                country: summary.country || 'N/A',
                employees: summary.fullTimeEmployees,
                marketCap: quote.marketCap || 0
            },

            financials: {
                pe: keyStats.forwardPE || quote.trailingPE || null,
                eps: quote.epsTrailingTwelveMonths,
                roe: financials.returnOnEquity || 0,
                roa: financials.returnOnAssets || 0,
                debtToEquity: financials.debtToEquity || 0,
                currentRatio: financials.currentRatio || 0,
                profitMargin: financials.profitMargins || 0,
                revenueGrowth: financials.revenueGrowth || 0,
                divYield: quote.trailingAnnualDividendYield || 0,
                targetPrice: financials.targetMeanPrice || null,
                analystRating: financials.recommendationKey || 'N/A'
            },

            marketContext,

            recommendation: {
                action: recommendation.action, // BUY, HOLD, SELL
                confidence: recommendation.confidence, // 0-100
                timeHorizon: recommendation.timeHorizon, // SHORT_TERM, LONG_TERM
                reasoning: recommendation.reasoning,
                riskLevel: recommendation.riskLevel, // LOW, MEDIUM, HIGH
                technicalScore: technicalScore,
                fundamentalScore: fundamentalScore,
                overallScore: (technicalScore + fundamentalScore) / 2
            },

            analysis: {
                pros,
                cons
            },

            peers: peers,

            lastUpdated: new Date().toISOString()
        };

        res.status(200).json(responseData);

    } catch (e) {
        console.error("Deep Research API Error:", e);
        res.status(500).json({
            error: 'Analysis failed',
            message: e.message || 'An unexpected error occurred while analyzing the stock.'
        });
    }
}

// --- HELPER FUNCTIONS ---

function calculateTechnicalScore(quote, historical) {
    let score = 50; // Neutral baseline

    // Price momentum
    if (quote.regularMarketChangePercent > 2) score += 15;
    else if (quote.regularMarketChangePercent > 0) score += 5;
    else if (quote.regularMarketChangePercent < -2) score -= 15;
    else if (quote.regularMarketChangePercent < 0) score -= 5;

    // 52-week position
    const range = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow;
    const position = (quote.regularMarketPrice - quote.fiftyTwoWeekLow) / range;
    if (position > 0.8) score += 10; // Near high
    else if (position < 0.2) score -= 10; // Near low

    // Volume
    if (quote.regularMarketVolume > quote.averageDailyVolume3Month * 1.5) score += 10;

    return Math.max(0, Math.min(100, score));
}

function calculateFundamentalScore(financials, keyStats) {
    let score = 50;

    // Profitability
    if (financials.returnOnEquity > 0.20) score += 20;
    else if (financials.returnOnEquity > 0.15) score += 10;
    else if (financials.returnOnEquity < 0.05) score -= 15;

    // Growth
    if (financials.revenueGrowth > 0.20) score += 15;
    else if (financials.revenueGrowth > 0.10) score += 8;
    else if (financials.revenueGrowth < 0) score -= 10;

    // Valuation
    if (keyStats.forwardPE && keyStats.forwardPE < 15) score += 10;
    else if (keyStats.forwardPE && keyStats.forwardPE > 40) score -= 10;

    // Debt
    if (financials.debtToEquity < 30) score += 10;
    else if (financials.debtToEquity > 100) score -= 15;

    return Math.max(0, Math.min(100, score));
}

function generateRecommendation(techScore, fundScore, financials, keyStats, quote) {
    const overallScore = (techScore + fundScore) / 2;
    let action, confidence, timeHorizon, reasoning, riskLevel;

    // Determine action
    if (overallScore >= 70) {
        action = 'STRONG BUY';
        confidence = overallScore;
        timeHorizon = 'LONG_TERM';
        reasoning = 'Strong fundamentals and positive technical momentum suggest excellent long-term growth potential.';
        riskLevel = 'LOW';
    } else if (overallScore >= 60) {
        action = 'BUY';
        confidence = overallScore;
        timeHorizon = 'MEDIUM_TERM';
        reasoning = 'Solid fundamentals with room for growth. Good entry point for medium to long-term investors.';
        riskLevel = 'MEDIUM';
    } else if (overallScore >= 45) {
        action = 'HOLD';
        confidence = 50;
        timeHorizon = 'WAIT_AND_WATCH';
        reasoning = 'Mixed signals. Current holders may hold, but new investors should wait for clearer trends.';
        riskLevel = 'MEDIUM';
    } else if (overallScore >= 35) {
        action = 'SELL';
        confidence = 100 - overallScore;
        timeHorizon = 'SHORT_TERM';
        reasoning = 'Weak fundamentals or negative momentum. Consider reducing exposure.';
        riskLevel = 'HIGH';
    } else {
        action = 'STRONG SELL';
        confidence = 100 - overallScore;
        timeHorizon = 'IMMEDIATE';
        reasoning = 'Significant concerns in both technical and fundamental analysis. High risk of further decline.';
        riskLevel = 'VERY_HIGH';
    }

    // Adjust based on volatility
    if (keyStats.beta > 1.5) {
        riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
    }

    return { action, confidence, timeHorizon, reasoning, riskLevel };
}

function generateProsAndCons(financials, keyStats, summary, quote) {
    const pros = [];
    const cons = [];

    // Profitability
    if (financials.returnOnEquity > 0.15) pros.push(`Strong ROE of ${(financials.returnOnEquity * 100).toFixed(1)}% indicates efficient capital utilization`);
    if (financials.profitMargins > 0.15) pros.push(`Healthy profit margin of ${(financials.profitMargins * 100).toFixed(1)}%`);
    if (financials.returnOnAssets < 0.05) cons.push('Low return on assets suggests inefficient asset utilization');

    // Growth
    if (financials.revenueGrowth > 0.15) pros.push(`Strong revenue growth of ${(financials.revenueGrowth * 100).toFixed(1)}% YoY`);
    if (financials.revenueGrowth < 0) cons.push('Declining revenue is a red flag for future growth');

    // Valuation
    if (keyStats.forwardPE && keyStats.forwardPE < 20) pros.push(`Attractive valuation with P/E of ${keyStats.forwardPE.toFixed(1)}`);
    if (keyStats.forwardPE && keyStats.forwardPE > 50) cons.push(`High P/E ratio of ${keyStats.forwardPE.toFixed(1)} suggests overvaluation`);

    // Financial Health
    if (financials.debtToEquity < 50) pros.push('Low debt levels provide financial flexibility');
    if (financials.debtToEquity > 100) cons.push('High debt-to-equity ratio increases financial risk');
    if (financials.currentRatio > 1.5) pros.push('Strong liquidity position with current ratio > 1.5');

    // Market Position
    if (quote.marketCap > 100000000000) pros.push('Large-cap stability with market cap > $100B');
    if (keyStats.beta && keyStats.beta > 1.5) cons.push('High volatility (Beta > 1.5) increases short-term risk');

    // Dividends
    if (quote.trailingAnnualDividendYield > 0.03) pros.push(`Attractive dividend yield of ${(quote.trailingAnnualDividendYield * 100).toFixed(2)}%`);

    // Fallbacks
    if (pros.length === 0) pros.push('Established market presence');
    if (cons.length === 0) cons.push('Monitor for emerging risks in volatile market conditions');

    return { pros, cons };
}

function getPeerStocks(sector, currentSymbol) {
    const peerMap = {
        'Technology': ['INFY.NS', 'TCS.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS'],
        'Financial Services': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
        'Energy': ['RELIANCE.NS', 'BPCL.NS', 'ONGC.NS', 'IOC.NS', 'POWERGRID.NS'],
        'Consumer': ['ITC.NS', 'HINDUNILVR.NS', 'NESTLEIND.NS', 'BRITANNIA.NS'],
        'Automobile': ['TATAMOTORS.NS', 'M&M.NS', 'MARUTI.NS', 'BAJAJ-AUTO.NS'],
        'Pharmaceutical': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS']
    };

    let peers = peerMap[sector] || ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS'];
    return peers.filter(p => p !== currentSymbol).slice(0, 5);
}
