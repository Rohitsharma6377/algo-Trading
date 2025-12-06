
import dbConnect from '../../../lib/db';
import OHLC from '../../../models/OHLC';
import { trainModel } from '../../../lib/trainer';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    // Auth Check
    // const { auth_token } = req.cookies;
    // const user = verifyToken(auth_token);
    // if(!user || user.role !== 'admin') return res.status(403).json({error:'Admin only'});

    await dbConnect();

    // Get all symbols
    const symbols = await OHLC.distinct('symbol');
    const results = [];

    // Process sequentially to avoid memory overload
    for (const sym of symbols) {
        try {
            console.log(`Starting training for ${sym}...`);
            const res = await trainModel(sym);
            results.push({ symbol: sym, status: 'Success', accuracy: res.accuracy });
        } catch (e) {
            console.error(`Training failed for ${sym}:`, e);
            results.push({ symbol: sym, status: 'Failed', error: e.message });
        }
    }

    res.status(200).json({ results });
}
