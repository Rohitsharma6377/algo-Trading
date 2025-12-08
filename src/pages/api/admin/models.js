
import dbConnect from '../../../lib/db';
import ModelMeta from '../../../models/ModelMeta';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    try {
        await dbConnect();
        const models = await ModelMeta.find({}).sort({ trainingDate: -1 }).lean();
        res.status(200).json(models);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
}
