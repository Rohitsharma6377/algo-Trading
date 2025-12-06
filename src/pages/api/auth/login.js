
import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import { verifyPassword, generateToken } from '../../../lib/auth';
import cookie from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    await dbConnect();

    const user = await User.findOne({ email });

    // Check if user exists AND has a password hash (prevent legacy data crash)
    if (!user || !user.passwordHash) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    try {
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ userId: user._id, email: user.email, role: user.role });

        res.setHeader(
            'Set-Cookie',
            cookie.serialize('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                sameSite: 'strict',
                path: '/',
            })
        );

        res.status(200).json({ message: 'Logged in', user: { email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
