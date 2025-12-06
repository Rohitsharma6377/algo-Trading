
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function AdminTraining() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);

    const handleTrainAll = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/train-all', { method: 'POST' });
            const data = await res.json();
            setResults(data.results || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-8 font-mono text-white">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-neon-green">MODEL TRAINING</h1>
                    <Link href="/admin" className="text-sm text-gray-500 hover:text-white">← Back</Link>
                </div>

                <button
                    onClick={handleTrainAll}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded uppercase tracking-widest font-bold disabled:opacity-50"
                >
                    {loading ? 'TRAINING IN PROGRESS...' : 'START ALL MODEL TRAINING'}
                </button>

                <div className="mt-8">
                    {results.map((r, i) => (
                        <div key={i} className="border-b border-gray-800 py-2 flex justify-between">
                            <span>{r.symbol}</span>
                            <span className={r.status === 'Success' ? 'text-green-500' : 'text-red-500'}>
                                {r.status} {r.accuracy && `(Acc: ${(r.accuracy * 100).toFixed(1)}%)`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
