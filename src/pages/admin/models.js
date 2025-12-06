
import React from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function AdminModels() {
    return (
        <Layout>
            <div className="p-8 font-mono text-white">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-neon-green">TRAINED MODELS</h1>
                    <Link href="/admin" className="text-sm text-gray-500 hover:text-white">← Back</Link>
                </div>
                <p className="text-gray-500">Model registry lookup pending.</p>
            </div>
        </Layout>
    );
}
