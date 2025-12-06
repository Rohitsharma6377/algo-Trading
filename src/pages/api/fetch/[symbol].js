
import { fetchAndSaveStock } from '../../../lib/yahoo';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { symbol } = req.query;
  const { auth_token } = req.cookies;

  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  // Auth Check
  if (!auth_token || !verifyToken(auth_token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await fetchAndSaveStock(symbol.toUpperCase());
    res.status(200).json({ message: 'Fetch complete', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
