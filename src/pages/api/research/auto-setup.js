
import dbConnect from '../../../lib/db';
import OHLCV from '../../../models/OHLCV';
import NewsSentiment from '../../../models/NewsSentiment';
import ModelMeta from '../../../models/ModelMeta';
import yahooFinance from 'yahoo-finance2';

const { trainModel, saveModel } = require('../../../lib/mlModel');
const { calculateIndicators } = require('../../../lib/indicators');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const cleanSym = symbol.trim().toUpperCase();

    try {
        await dbConnect();

        console.log(`[Auto-Setup] Starting auto-setup for ${cleanSym}...`);

        // Step 1: Check if data already exists
        const existingData = await OHLCV.countDocuments({ symbol: cleanSym });

        if (existingData < 200) {
            console.log(`[Auto-Setup] Downloading historical data for ${cleanSym}...`);

            // Download 10 years of data
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 10);

            try {
                const result = await yahooFinance.historical(cleanSym, {
                    period1: startDate.toISOString().split('T')[0],
                    period2: endDate.toISOString().split('T')[0],
                    interval: '1d'
                });

                console.log(`[Auto-Setup] Downloaded ${result.length} days of data`);

                if (result.length < 200) {
                    return res.status(400).json({
                        error: 'Insufficient data',
                        message: `Only ${result.length} days of data available for ${cleanSym}. Need at least 200 days.`
                    });
                }

                // Save to database
                const bulkOps = result.map(candle => ({
                    updateOne: {
                        filter: { symbol: cleanSym, date: candle.date },
                        update: {
                            $set: {
                                symbol: cleanSym,
                                date: candle.date,
                                open: candle.open,
                                high: candle.high,
                                low: candle.low,
                                close: candle.close,
                                volume: candle.volume,
                                adjClose: candle.adjClose || candle.close
                            }
                        },
                        upsert: true
                    }
                }));

                await OHLCV.bulkWrite(bulkOps);
                console.log(`[Auto-Setup] Saved ${bulkOps.length} records to database`);

            } catch (downloadError) {
                console.error(`[Auto-Setup] Download error:`, downloadError);
                return res.status(500).json({
                    error: 'Download failed',
                    message: `Unable to download data for ${cleanSym}. Please verify the symbol is correct.`
                });
            }
        } else {
            console.log(`[Auto-Setup] Data already exists (${existingData} records)`);
        }

        // Step 2: Generate mock news sentiment
        const existingNews = await NewsSentiment.countDocuments({ symbol: cleanSym });
        if (existingNews < 10) {
            console.log(`[Auto-Setup] Generating news sentiment data...`);
            const mockNews = [];
            const today = new Date();

            for (let i = 0; i < 100; i++) {
                const newsDate = new Date(today);
                newsDate.setDate(newsDate.getDate() - i);

                mockNews.push({
                    symbol: cleanSym,
                    date: newsDate,
                    headline: `Market update for ${cleanSym} - Day ${i}`,
                    source: 'Market News',
                    url: `https://example.com/news/${i}`,
                    sentimentScore: (Math.random() - 0.5) * 2
                });
            }

            const newsBulkOps = mockNews.map(news => ({
                updateOne: {
                    filter: { symbol: cleanSym, date: news.date },
                    update: { $set: news },
                    upsert: true
                }
            }));

            await NewsSentiment.bulkWrite(newsBulkOps);
            console.log(`[Auto-Setup] Saved ${newsBulkOps.length} news items`);
        }

        // Step 3: Check if model exists
        const existingModel = await ModelMeta.findOne({ symbol: cleanSym, isActive: true });

        if (!existingModel) {
            console.log(`[Auto-Setup] Training ML model for ${cleanSym}...`);

            // Fetch data for training
            const data = await OHLCV.find({ symbol: cleanSym }).sort({ date: 1 }).lean();

            if (data.length < 200) {
                return res.status(400).json({
                    error: 'Insufficient data',
                    message: `Need at least 200 days of data to train model. Found ${data.length} days.`
                });
            }

            // Calculate indicators
            const indicators = calculateIndicators(data);

            // Prepare features and labels
            const features = [];
            const labels = [];

            for (let i = 20; i < data.length - 1; i++) {
                const current = data[i];
                const prev = data[i - 1];
                const next = data[i + 1];

                // Feature vector
                const featureVector = [
                    (current.close - prev.close) / prev.close,
                    current.volume / (data.slice(Math.max(0, i - 20), i).reduce((sum, d) => sum + d.volume, 0) / 20),
                    indicators.rsi[i] / 100,
                    indicators.macd[i] / current.close,
                    indicators.macdSignal[i] / current.close,
                    indicators.macdHistogram[i] / current.close,
                    (current.close - indicators.bbLower[i]) / (indicators.bbUpper[i] - indicators.bbLower[i]),
                    (current.close - indicators.sma20[i]) / indicators.sma20[i],
                    (current.close - indicators.sma50[i]) / indicators.sma50[i],
                    (indicators.sma20[i] - indicators.sma50[i]) / indicators.sma50[i],
                    indicators.atr[i] / current.close,
                    0 // Sentiment placeholder
                ];

                // Label (0=sell, 1=hold, 2=buy)
                const priceChange = (next.close - current.close) / current.close;
                let label;
                if (priceChange > 0.02) label = [0, 0, 1]; // Buy
                else if (priceChange < -0.02) label = [1, 0, 0]; // Sell
                else label = [0, 1, 0]; // Hold

                features.push(featureVector);
                labels.push(label);
            }

            console.log(`[Auto-Setup] Prepared ${features.length} training samples`);

            // Train the model
            const { model, metrics } = await trainModel(features, labels, {
                epochs: 50,
                batchSize: 32
            });

            // Save the model
            const { modelPath } = await saveModel(model, cleanSym);

            // Save metadata
            await ModelMeta.create({
                symbol: cleanSym,
                modelType: 'MLP',
                features: ['returns', 'volume_ratio', 'rsi', 'macd', 'macd_signal', 'macd_hist', 'bb_position', 'sma20_diff', 'sma50_diff', 'sma_cross', 'atr', 'sentiment'],
                trainingDate: new Date(),
                trainingDataRange: {
                    start: data[0].date,
                    end: data[data.length - 1].date
                },
                metrics,
                isActive: true,
                modelPath
            });

            console.log(`[Auto-Setup] Model trained successfully!`);
            console.log(`   Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
            console.log(`   Val Accuracy: ${(metrics.valAccuracy * 100).toFixed(2)}%`);

            return res.status(200).json({
                success: true,
                message: `Successfully set up ${cleanSym}`,
                dataPoints: data.length,
                modelAccuracy: metrics.accuracy,
                newlyCreated: true
            });
        } else {
            console.log(`[Auto-Setup] Model already exists for ${cleanSym}`);
            return res.status(200).json({
                success: true,
                message: `${cleanSym} is already set up`,
                dataPoints: existingData,
                modelAccuracy: existingModel.metrics?.accuracy || 0,
                newlyCreated: false
            });
        }

    } catch (error) {
        console.error(`[Auto-Setup] Error:`, error);
        return res.status(500).json({
            error: 'Setup failed',
            message: error.message || 'An unexpected error occurred during setup.'
        });
    }
}
