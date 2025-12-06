
import { verifyToken } from '../../lib/auth';
import dbConnect from '../../lib/db';
import Portfolio from '../../models/Portfolio';

export default async function handler(req, res) {
    const { auth_token } = req.cookies;
    if (!auth_token) return res.status(401).json({ message: 'Not authenticated' });

    const payload = verifyToken(auth_token);
    if (!payload) return res.status(401).json({ message: 'Invalid token' });

    await dbConnect();

    let portfolio = await Portfolio.findOne({ userId: payload.userId });
    if (!portfolio) {
        portfolio = await Portfolio.create({ userId: payload.userId });
    }

    if (req.method === 'GET') {
        return res.status(200).json({ portfolio });
    }

    if (req.method === 'POST') {
        const { action } = req.body;
        if (action === 'toggleAuto') {
            portfolio.isAutoTrading = !portfolio.isAutoTrading;
            await portfolio.save();
            return res.status(200).json({ portfolio });
        }
    }

    res.status(405).json({ message: 'Method not allowed' });
}
