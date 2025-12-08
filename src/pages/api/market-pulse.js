
import { getTrendingStocks, getMarketNews } from '../../lib/yahoo';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    try {
        // Fetch Parallel
        const [trending, news] = await Promise.all([
            getTrendingStocks('IN'),
            getMarketNews('Nifty 50 Sensex Economy')
        ]);

        res.status(200).json({
            trending: trending.map(q => ({
                symbol: q.symbol,
                price: q.regularMarketPrice,
                changePercent: q.regularMarketChangePercent,
                name: q.shortName || q.longName
            })),
            news: news.map(n => ({
                title: n.title,
                publisher: n.publisher,
                link: n.link,
                score: n.sentimentScore,
                type: n.type
            }))
        });
    } catch (e) {
        console.error("Market Pulse API Error:", e);
        res.status(500).json({ error: "Failed to fetch market data" });
    }
}
