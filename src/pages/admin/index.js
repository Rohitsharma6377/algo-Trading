
import React, { useState, useEffect } from 'react';
import useUserStore from '../../store/useUserStore';
import useAdminStore from '../../store/useAdminStore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

import AdminGuard from '../../components/AdminGuard';

export default function Admin() {
    const { user } = useUserStore();
    const { logs, loadingAction, runAdminAction } = useAdminStore();
    const router = useRouter();

    const [symbol, setSymbol] = useState('');

    const handleAction = (action) => {
        if (!symbol) return;
        runAdminAction(action, symbol);
    };

    const navLinks = [
        { name: 'Users', href: '/admin/users' },
        { name: 'Training', href: '/admin/training' },
        { name: 'Models', href: '/admin/models' },
        { name: 'Logs', href: '/admin/logs' },
        { name: 'Research', href: '/admin/research' },
    ];

    return (
        <AdminGuard>
            <Layout>
                <div className="min-h-screen font-mono p-4 md:p-8 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>

                    <div className="w-full h-full min-h-[85vh] border-2 border-green-900 bg-gray-900/90 rounded-lg p-6 shadow-[0_0_20px_rgba(0,255,0,0.1)] relative z-10 flex flex-col">

                        {/* Header */}
                        <div className="flex justify-between items-end border-b-2 border-green-900 pb-4 mb-8">
                            <div>
                                <h1 className="text-4xl font-bold tracking-tighter text-neon-green glitch-text">COMMAND_CENTER</h1>
                                <p className="text-xs text-green-700 uppercase tracking-widest mt-1">ROOT ACCESS GRANTED // USER: {user?.email || 'SYSTEM'}</p>
                            </div>
                        </div>

                        {/* Admin Nav */}
                        <div className="flex space-x-4 mb-6">
                            {navLinks.map(l => (
                                <Link key={l.name} href={l.href} className="px-4 py-2 border border-green-800 text-green-500 hover:bg-green-900/50 hover:text-white transition uppercase text-xs tracking-wider">
                                    {l.name}
                                </Link>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Control Panel */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-black border border-green-800 p-6">
                                    <label className="block text-green-600 text-xs uppercase mb-2">Target Asset</label>
                                    <input
                                        type="text"
                                        value={symbol}
                                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                        placeholder="SYMBOL_REQ"
                                        className="w-full bg-green-900/10 border-b border-green-500 text-2xl font-bold text-white focus:outline-none focus:border-neon-green py-2 placeholder-green-900 font-mono"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleAction('fetch')}
                                        disabled={loadingAction}
                                        className="w-full py-4 border border-blue-900 text-blue-500 hover:bg-blue-900/20 hover:text-blue-300 transition uppercase tracking-widest flex items-center justify-between px-4 group disabled:opacity-50"
                                    >
                                        <span>1. Data_Ingest</span>
                                        <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:animate-ping"></span>
                                    </button>

                                    <button
                                        onClick={() => handleAction('train')}
                                        disabled={loadingAction}
                                        className="w-full py-4 border border-purple-900 text-purple-500 hover:bg-purple-900/20 hover:text-purple-300 transition uppercase tracking-widest flex items-center justify-between px-4 group disabled:opacity-50"
                                    >
                                        <span>2. Model_Training</span>
                                        <span className="w-2 h-2 bg-purple-500 rounded-full group-hover:animate-ping"></span>
                                    </button>

                                    <button
                                        onClick={() => handleAction('predict')}
                                        disabled={loadingAction}
                                        className="w-full py-4 border border-green-900 text-green-500 hover:bg-green-900/20 hover:text-green-300 transition uppercase tracking-widest flex items-center justify-between px-4 group disabled:opacity-50"
                                    >
                                        <span>3. Run_Inference</span>
                                        <span className="w-2 h-2 bg-green-500 rounded-full group-hover:animate-ping"></span>
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-2 flex flex-col h-full">
                                <div className="bg-black border border-green-800 flex-1 min-h-[500px] p-4 font-mono text-sm overflow-y-auto relative">
                                    <div className="absolute top-2 right-4 text-[10px] text-green-900">SYS_LOG.TXT</div>
                                    {logs.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-green-900 opacity-50">
                                            <div className="w-16 h-16 border-4 border-green-900 border-t-green-500 rounded-full animate-spin mb-4"></div>
                                            <p>WAITING FOR INPUT...</p>
                                        </div>
                                    )}
                                    {logs.map((log, i) => (
                                        <div key={i} className={`mb-2 font-mono ${log.type === 'ERROR' ? 'text-red-500' : log.type === 'SUCCESS' ? 'text-neon-green' : 'text-green-400'}`}>
                                            <span className="opacity-50 text-xs">[{log.time}]</span>{' '}
                                            <span className="font-bold">[{log.type}]</span>{' '}
                                            <span>{log.msg}</span>
                                        </div>
                                    ))}
                                    {loadingAction && (
                                        <div className="animate-pulse text-green-500 mt-2">_ PROCESSING REQUEST...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </AdminGuard>
    );
}
