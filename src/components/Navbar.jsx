
import React from 'react';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="w-full h-16 bg-black/80 backdrop-blur border-b border-white/10 flex items-center justify-between px-6 fixed top-0 z-50">
            <Link href="/">
                <span className="text-xl font-bold font-mono text-white">ALGO<span className="text-neon-blue">.AI</span></span>
            </Link>
            <div className="flex space-x-4">
                <Link href="/auth/login" className="text-xs font-mono text-gray-400 hover:text-white uppercase">Login</Link>
                <Link href="/auth/register" className="text-xs font-mono text-neon-blue border border-neon-blue/30 px-3 py-1 rounded hover:bg-neon-blue/10 uppercase">Register</Link>
            </div>
        </nav>
    );
}
