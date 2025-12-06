
import React from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function AdminUsers() {
    return (
        <Layout>
            <div className="p-8 font-mono text-white">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-neon-green">USER MANAGEMENT</h1>
                    <Link href="/admin" className="text-sm text-gray-500 hover:text-white">← Back</Link>
                </div>
                <p className="text-gray-500">User management module pending backend integration.</p>
            </div>
        </Layout>
    );
}
