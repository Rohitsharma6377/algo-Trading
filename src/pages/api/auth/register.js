
import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import { hashPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(422).json({ message: 'Invalid input' });
  }

  await dbConnect();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(422).json({ message: 'User already exists' });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await User.create({
    email,
    passwordHash: hashedPassword,
    role: role || 'trader', // default to trader
  });

  res.status(201).json({ message: 'Created user!', userId: newUser._id });
}
