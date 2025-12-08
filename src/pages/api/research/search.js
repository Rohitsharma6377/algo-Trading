
import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const { q } = req.query;
    if (!q) return res.status(200).json([]);

    try {
        const result = await yahooFinance.search(q, { newsCount: 0, quotesCount: 5 });
        const quotes = result.quotes.filter(quote => quote.isYahooFinance); // Filter valid

        const suggestions = quotes.map(quote => ({
            symbol: quote.symbol,
            name: quote.shortname || quote.longname || quote.symbol,
            exch: quote.exchange,
            type: quote.quoteType
        }));

        res.status(200).json(suggestions);
    } catch (e) {
        console.error("Search API Error:", e);
        res.status(500).json({ error: "Search failed" });
    }
}
