
import dbConnect from '../../../lib/db';
import OHLCV from '../../../models/OHLCV';
import NewsSentiment from '../../../models/NewsSentiment';
import ModelMeta from '../../../models/ModelMeta';
import { getCompanyInfo } from '../../../lib/yahoo';
import yahooFinance from 'yahoo-finance2';

const { loadModel, predict } = require('../../../lib/mlModel');
const { calculateIndicators } = require('../../../lib/indicators');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const cleanSym = symbol.trim().toUpperCase();
    if (cleanSym.length < 2) {
        return res.status(400).json({
            error: 'Invalid symbol format',
            message: 'Please use a valid stock symbol (e.g., RELIANCE.NS, TCS.NS)'
        });
    }

    try {
        await dbConnect();

        // 1. Fetch comprehensive data with error handling
        console.log(`[AI Analysis] Fetching comprehensive data for ${cleanSym}...`);

        let info, quote, historicalData, newsData, modelMeta;

        try {
            [info, quote, historicalData, newsData, modelMeta] = await Promise.all([
                getCompanyInfo(cleanSym).catch(err => {
                    console.warn(`[AI Analysis] Company info error for ${cleanSym}:`, err.message);
                    return null;
                }),
                yahooFinance.quote(cleanSym).catch(err => {
                    console.warn(`[AI Analysis] Quote error for ${cleanSym}:`, err.message);
                    return null;
                }),
                OHLCV.find({ symbol: cleanSym }).sort({ date: 1 }).lean(),
                NewsSentiment.find({ symbol: cleanSym }).sort({ date: -1 }).limit(100).lean(),
                ModelMeta.findOne({ symbol: cleanSym, isActive: true }).lean()
            ]);
        } catch (fetchError) {
            console.error(`[AI Analysis] Data fetch error:`, fetchError);
            return res.status(500).json({
                error: 'Data fetch failed',
                message: 'Unable to fetch market data. Please try again later.'
            });
        }

        // Validate we have minimum required data
        if (!quote || !quote.regularMarketPrice) {
            return res.status(404).json({
                error: 'Stock not found',
                message: `Unable to fetch current price for "${cleanSym}". Please verify the symbol is correct.`
            });
        }

        if (historicalData.length < 200) {
            return res.status(404).json({
                error: 'Insufficient data',
                message: `Need at least 200 days of historical data for AI analysis. Found ${historicalData.length} days. Please run: npm run quick-setup`
            });
        }

        // 2. Load the trained ML model for this symbol
        console.log(`[AI Analysis] Loading ML model for ${cleanSym}...`);
        const model = await loadModel(cleanSym);

        // 3. Calculate technical indicators
        const indicators = calculateIndicators(historicalData);
        const latestIdx = historicalData.length - 1;

        // 4. Get latest news sentiment
        const recentSentiment = newsData.slice(0, 30);
        const avgSentiment = recentSentiment.length > 0
            ? recentSentiment.reduce((sum, n) => sum + (n.sentimentScore || 0), 0) / recentSentiment.length
            : 0;

        // 5. Prepare features for ML prediction
        const latestFeatures = extractFeatures(historicalData, indicators, latestIdx, avgSentiment);

        // 6. Get AI prediction
        let aiPrediction = null;
        let mlConfidence = 0;

        if (model && latestFeatures) {
            console.log(`[AI Analysis] Running ML prediction...`);
            const probs = await predict(model, latestFeatures);
            aiPrediction = {
                sellProb: probs[0] * 100,
                holdProb: probs[1] * 100,
                buyProb: probs[2] * 100,
                prediction: probs[2] > probs[0] ? (probs[2] > 0.6 ? 'STRONG_BUY' : 'BUY') : (probs[0] > 0.6 ? 'STRONG_SELL' : 'HOLD')
            };
            mlConfidence = Math.max(...probs) * 100;
        }

        // 7. Analyze historical performance
        const performanceAnalysis = analyzeHistoricalPerformance(historicalData);

        // 8. News sentiment analysis
        const sentimentAnalysis = analyzeNewsSentiment(newsData);

        // 9. Generate comprehensive recommendation
        const recommendation = generateAIRecommendation(
            aiPrediction,
            performanceAnalysis,
            sentimentAnalysis,
            info,
            quote,
            modelMeta
        );

        // 10. Construct response
        const financials = info?.financialData || {};
        const keyStats = info?.defaultKeyStatistics || {};
        const summary = info?.summaryProfile || {};
        const price = quote.regularMarketPrice || 0;

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

            marketContext: {
                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
                percentFromHigh: ((price - quote.fiftyTwoWeekHigh) / quote.fiftyTwoWeekHigh * 100).toFixed(2),
                percentFromLow: ((price - quote.fiftyTwoWeekLow) / quote.fiftyTwoWeekLow * 100).toFixed(2),
                avgVolume: quote.averageDailyVolume3Month,
                marketCap: quote.marketCap,
                beta: keyStats.beta || 1
            },

            aiAnalysis: {
                mlPrediction: aiPrediction,
                mlConfidence: mlConfidence,
                modelAccuracy: modelMeta?.metrics?.accuracy || 0,
                modelLastTrained: modelMeta?.trainingDate,
                dataPointsAnalyzed: historicalData.length,
                newsItemsAnalyzed: newsData.length,
                performanceMetrics: performanceAnalysis,
                sentimentMetrics: sentimentAnalysis
            },

            recommendation: recommendation,
            analysis: generateProsAndCons(financials, keyStats, summary, quote, performanceAnalysis, sentimentAnalysis),
            peers: getPeerStocks(summary.sector, cleanSym),
            lastUpdated: new Date().toISOString()
        };

        res.status(200).json(responseData);

    } catch (e) {
        console.error("AI Analysis API Error:", e);
        res.status(500).json({
            error: 'Analysis failed',
            message: e.message || 'An unexpected error occurred.'
        });
    }
}

// Helper functions remain the same...
function extractFeatures(ohlcData, indicators, idx, sentimentScore) {
    if (idx < 20) return null;
    const current = ohlcData[idx];
    const prev = ohlcData[idx - 1];
    return [
        (current.close - prev.close) / prev.close,
        current.volume / (ohlcData.slice(Math.max(0, idx - 20), idx).reduce((sum, d) => sum + d.volume, 0) / 20),
        indicators.rsi[idx] / 100,
        indicators.macd[idx] / current.close,
        indicators.macdSignal[idx] / current.close,
        indicators.macdHistogram[idx] / current.close,
        (current.close - indicators.bbLower[idx]) / (indicators.bbUpper[idx] - indicators.bbLower[idx]),
        (current.close - indicators.sma20[idx]) / indicators.sma20[idx],
        (current.close - indicators.sma50[idx]) / indicators.sma50[idx],
        (indicators.sma20[idx] - indicators.sma50[idx]) / indicators.sma50[idx],
        indicators.atr[idx] / current.close,
        sentimentScore
    ];
}

function analyzeHistoricalPerformance(data) {
    if (data.length < 252) return { insufficient: true };
    const returns = [];
    for (let i = 1; i < data.length; i++) {
        returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const annualizedReturn = avgReturn * 252;
    const annualizedVol = volatility * Math.sqrt(252);
    const sharpeRatio = (annualizedReturn - 0.05) / annualizedVol;
    let peak = data[0].close;
    let maxDrawdown = 0;
    for (const d of data) {
        if (d.close > peak) peak = d.close;
        const drawdown = (peak - d.close) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    return {
        avgDailyReturn: avgReturn * 100,
        annualizedReturn: annualizedReturn * 100,
        volatility: annualizedVol * 100,
        sharpeRatio: sharpeRatio,
        maxDrawdown: maxDrawdown * 100,
        totalReturn: ((data[data.length - 1].close - data[0].close) / data[0].close) * 100
    };
}

function analyzeNewsSentiment(newsData) {
    if (newsData.length === 0) return { noData: true };
    const recent30Days = newsData.filter(n => {
        const daysDiff = (Date.now() - new Date(n.date).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
    });
    const avgSentiment = recent30Days.reduce((sum, n) => sum + (n.sentimentScore || 0), 0) / recent30Days.length;
    const positiveCount = recent30Days.filter(n => n.sentimentScore > 0.3).length;
    const negativeCount = recent30Days.filter(n => n.sentimentScore < -0.3).length;
    return {
        avgSentiment: avgSentiment,
        newsCount: recent30Days.length,
        positiveRatio: positiveCount / recent30Days.length,
        negativeRatio: negativeCount / recent30Days.length,
        trend: avgSentiment > 0.2 ? 'BULLISH' : avgSentiment < -0.2 ? 'BEARISH' : 'NEUTRAL'
    };
}

function generateAIRecommendation(mlPrediction, performance, sentiment, info, quote, modelMeta) {
    let action, confidence, reasoning, riskLevel, timeHorizon;
    if (mlPrediction) {
        if (mlPrediction.prediction === 'STRONG_BUY') {
            action = 'STRONG BUY';
            confidence = mlPrediction.buyProb;
            reasoning = `AI model (${(modelMeta?.metrics?.accuracy * 100 || 0).toFixed(1)}% accuracy) predicts strong upward movement with ${mlPrediction.buyProb.toFixed(1)}% confidence. `;
            timeHorizon = 'LONG_TERM';
            riskLevel = 'MEDIUM';
        } else if (mlPrediction.prediction === 'BUY') {
            action = 'BUY';
            confidence = mlPrediction.buyProb;
            reasoning = `AI model suggests buying opportunity with ${mlPrediction.buyProb.toFixed(1)}% confidence. `;
            timeHorizon = 'MEDIUM_TERM';
            riskLevel = 'MEDIUM';
        } else if (mlPrediction.prediction === 'STRONG_SELL') {
            action = 'STRONG SELL';
            confidence = mlPrediction.sellProb;
            reasoning = `AI model predicts significant downside risk with ${mlPrediction.sellProb.toFixed(1)}% confidence. `;
            timeHorizon = 'SHORT_TERM';
            riskLevel = 'HIGH';
        } else {
            action = 'HOLD';
            confidence = mlPrediction.holdProb;
            reasoning = `AI model suggests holding position. Market conditions are mixed. `;
            timeHorizon = 'WAIT_AND_WATCH';
            riskLevel = 'MEDIUM';
        }
        if (performance && !performance.insufficient) {
            reasoning += `Historical analysis shows ${performance.annualizedReturn.toFixed(1)}% annualized return with Sharpe ratio of ${performance.sharpeRatio.toFixed(2)}. `;
        }
        if (sentiment && !sentiment.noData) {
            reasoning += `Recent news sentiment is ${sentiment.trend} (${sentiment.newsCount} articles analyzed). `;
        }
        if (performance && performance.volatility > 40) {
            riskLevel = 'HIGH';
        } else if (performance && performance.volatility < 20) {
            riskLevel = 'LOW';
        }
    } else {
        action = 'HOLD';
        confidence = 50;
        reasoning = 'No trained ML model available for this symbol. Please train a model first in the Admin panel.';
        timeHorizon = 'WAIT_AND_WATCH';
        riskLevel = 'UNKNOWN';
    }
    return {
        action,
        confidence,
        timeHorizon,
        reasoning,
        riskLevel,
        technicalScore: mlPrediction ? mlPrediction.buyProb : 50,
        fundamentalScore: calculateFundamentalScore(info?.financialData || {}, info?.defaultKeyStatistics || {}),
        overallScore: mlPrediction ? (mlPrediction.buyProb + calculateFundamentalScore(info?.financialData || {}, info?.defaultKeyStatistics || {})) / 2 : 50
    };
}

function calculateFundamentalScore(financials, keyStats) {
    let score = 50;
    if (financials.returnOnEquity > 0.20) score += 20;
    else if (financials.returnOnEquity > 0.15) score += 10;
    else if (financials.returnOnEquity < 0.05) score -= 15;
    if (financials.revenueGrowth > 0.20) score += 15;
    else if (financials.revenueGrowth > 0.10) score += 8;
    else if (financials.revenueGrowth < 0) score -= 10;
    if (keyStats.forwardPE && keyStats.forwardPE < 15) score += 10;
    else if (keyStats.forwardPE && keyStats.forwardPE > 40) score -= 10;
    if (financials.debtToEquity < 30) score += 10;
    else if (financials.debtToEquity > 100) score -= 15;
    return Math.max(0, Math.min(100, score));
}

function generateProsAndCons(financials, keyStats, summary, quote, performance, sentiment) {
    const pros = [];
    const cons = [];
    if (performance && !performance.insufficient) {
        if (performance.sharpeRatio > 1) pros.push(`Excellent risk-adjusted returns with Sharpe ratio of ${performance.sharpeRatio.toFixed(2)}`);
        if (performance.annualizedReturn > 15) pros.push(`Strong historical performance: ${performance.annualizedReturn.toFixed(1)}% annualized return`);
        if (performance.maxDrawdown < 20) pros.push(`Low maximum drawdown of ${performance.maxDrawdown.toFixed(1)}% indicates stability`);
        if (performance.volatility > 40) cons.push(`High volatility (${performance.volatility.toFixed(1)}%) increases investment risk`);
        if (performance.sharpeRatio < 0) cons.push('Negative risk-adjusted returns historically');
    }
    if (sentiment && !sentiment.noData) {
        if (sentiment.positiveRatio > 0.6) pros.push(`Strong positive news sentiment (${(sentiment.positiveRatio * 100).toFixed(0)}% of recent articles)`);
        if (sentiment.negativeRatio > 0.6) cons.push(`Predominantly negative news coverage (${(sentiment.negativeRatio * 100).toFixed(0)}% of articles)`);
    }
    if (financials.returnOnEquity > 0.15) pros.push(`Strong ROE of ${(financials.returnOnEquity * 100).toFixed(1)}%`);
    if (financials.profitMargins > 0.15) pros.push(`Healthy profit margin of ${(financials.profitMargins * 100).toFixed(1)}%`);
    if (financials.revenueGrowth > 0.15) pros.push(`Strong revenue growth of ${(financials.revenueGrowth * 100).toFixed(1)}% YoY`);
    if (financials.debtToEquity < 50) pros.push('Low debt levels provide financial flexibility');
    if (financials.returnOnAssets < 0.05) cons.push('Low return on assets suggests inefficient asset utilization');
    if (financials.revenueGrowth < 0) cons.push('Declining revenue is a red flag');
    if (financials.debtToEquity > 100) cons.push('High debt-to-equity ratio increases financial risk');
    if (keyStats.forwardPE && keyStats.forwardPE > 50) cons.push(`High P/E ratio of ${keyStats.forwardPE.toFixed(1)} suggests overvaluation`);
    if (pros.length === 0) pros.push('Established market presence');
    if (cons.length === 0) cons.push('Monitor for emerging risks');
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
