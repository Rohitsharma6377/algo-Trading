
import { verifyToken } from '../../../lib/auth';
import dbConnect from '../../../lib/db';
import User from '../../../models/User';

export default async function handler(req, res) {
  const { auth_token } = req.cookies;

  if (!auth_token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const payload = verifyToken(auth_token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  await dbConnect();
  const user = await User.findById(payload.userId).select('-passwordHash');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ user });
}
