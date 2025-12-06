
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import useUserStore from '../../store/useUserStore';
import Link from 'next/link';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { setUser } = useUserStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Something went wrong');

            setUser(data.user);
            router.push('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background FX */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md glass-panel p-10 rounded-2xl relative z-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple mb-2">
                        TRADER_LOGIN
                    </h2>
                    <p className="text-gray-400 text-xs uppercase tracking-[0.3em]">Secure Neural Access</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm font-mono flex items-center">
                        <span className="mr-2">⚠</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group">
                        <label className="block text-neon-blue/70 text-xs font-mono mb-2 uppercase tracking-wider group-focus-within:text-neon-blue transition-colors">Identity // Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded p-4 text-white focus:outline-none focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,243,255,0.1)] transition-all font-mono placeholder-gray-700"
                            placeholder="user@cortex.ai"
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-neon-blue/70 text-xs font-mono mb-2 uppercase tracking-wider group-focus-within:text-neon-blue transition-colors">Key // Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded p-4 text-white focus:outline-none focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,243,255,0.1)] transition-all font-mono placeholder-gray-700"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-black font-bold font-mono py-4 rounded hover:shadow-[0_0_20px_rgba(189,0,255,0.4)] transform hover:-translate-y-1 transition duration-200 mt-4 uppercase tracking-widest"
                    >
                        Authenticate
                    </button>
                </form>

                <p className="mt-8 text-center text-gray-500 text-xs font-mono">
                    NO ACCESS?{' '}
                    <Link href="/auth/register" className="text-neon-blue hover:text-white border-b border-neon-blue/30 pb-0.5 transition">
                        INITIATE SEQUENCE
                    </Link>
                </p>
            </div>
        </div>
    );
}
