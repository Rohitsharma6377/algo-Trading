
import { runBacktest } from '../../../lib/backtester';
import dbConnect from '../../../lib/db';
import OHLC from '../../../models/OHLC';
// import { loadModel } from '../../../lib/mlModel'; // Optional

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { symbol } = req.query;
  const { initialCapital } = req.body;

  await dbConnect();

  // Fetch Data
  const data = await OHLC.find({ symbol: symbol.toUpperCase() }).sort({ date: 1 }).lean();
  if (data.length < 200) return res.status(400).json({ error: 'Insufficent Data' });

  // Load Model (Optional)
  // const model = await loadModel(symbol);

  const result = await runBacktest(symbol.toUpperCase(), data, initialCapital);

  res.status(200).json(result);
}
