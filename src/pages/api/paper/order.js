
import { createOrder } from '../../../lib/paperEngine';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { auth_token } = req.cookies;
  const user = verifyToken(auth_token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { symbol, side, quantity, strategy } = req.body;

  try {
    const result = await createOrder(user.userId, symbol, side, Number(quantity), strategy);
    res.status(200).json({ success: true, portfolio: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}
