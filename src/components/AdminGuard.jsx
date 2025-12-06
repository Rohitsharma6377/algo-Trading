
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import useUserStore from '../store/useUserStore';

const AdminGuard = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useUserStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
            router.push('/');
        }
    }, [user, isAuthenticated, isLoading, router]);

    if (isLoading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center font-mono text-neon-green">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="animate-pulse">VERIFYING CLEARANCE...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminGuard;
