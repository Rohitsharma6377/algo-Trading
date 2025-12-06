
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminSidebar() {
    const router = useRouter();

    const links = [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Training', href: '/admin/training' },
        { name: 'Models', href: '/admin/models' },
        { name: 'Logs', href: '/admin/logs' },
    ];

    return (
        <div className="w-64 bg-black/50 border-r border-green-900 h-full p-4 font-mono">
            <div className="mb-8 text-neon-green font-bold text-xl tracking-tighter">
                ADMIN_CORE
            </div>
            <nav className="space-y-2">
                {links.map(l => {
                    const active = router.pathname === l.href;
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`block px-4 py-2 border ${active ? 'border-green-500 text-green-500 bg-green-900/20' : 'border-transparent text-gray-500 hover:text-green-400'} transition uppercase text-xs tracking-widest`}
                        >
                            {l.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
