
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('trader');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Something went wrong');

            router.push('/auth/login');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background FX */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-green/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md glass-panel p-10 rounded-2xl relative z-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-blue-500 mb-2">
                        NEW_PROFILE
                    </h2>
                    <p className="text-gray-400 text-xs uppercase tracking-[0.3em]">Join the Network</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm font-mono">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group">
                        <label className="block text-neon-green/70 text-xs font-mono mb-2 uppercase tracking-wider group-focus-within:text-neon-green transition-colors">Identity // Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded p-4 text-white focus:outline-none focus:border-neon-green focus:shadow-[0_0_15px_rgba(10,255,0,0.1)] transition-all font-mono placeholder-gray-700"
                            placeholder="user@cortex.ai"
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-neon-green/70 text-xs font-mono mb-2 uppercase tracking-wider group-focus-within:text-neon-green transition-colors">Secret // Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded p-4 text-white focus:outline-none focus:border-neon-green focus:shadow-[0_0_15px_rgba(10,255,0,0.1)] transition-all font-mono placeholder-gray-700"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="group">
                        <label className="block text-neon-green/70 text-xs font-mono mb-2 uppercase tracking-wider group-focus-within:text-neon-green transition-colors">Access Level</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded p-4 text-white focus:outline-none focus:border-neon-green transition-all font-mono appearance-none"
                        >
                            <option value="trader">TRADER (Standard)</option>
                            <option value="admin">ADMIN (Root)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-neon-green to-blue-500 text-black font-bold font-mono py-4 rounded hover:shadow-[0_0_20px_rgba(10,255,0,0.4)] transform hover:-translate-y-1 transition duration-200 mt-4 uppercase tracking-widest"
                    >
                        Create Identity
                    </button>
                </form>

                <p className="mt-8 text-center text-gray-500 text-xs font-mono">
                    ALREADY CONNECTED?{' '}
                    <Link href="/auth/login" className="text-neon-green hover:text-white border-b border-neon-green/30 pb-0.5 transition">
                        LOGIN
                    </Link>
                </p>
            </div>
        </div>
    );
}
