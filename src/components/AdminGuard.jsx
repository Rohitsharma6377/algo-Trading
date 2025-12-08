
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import useUserStore from '../store/useUserStore';

const AdminGuard = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useUserStore();
    const router = useRouter();

    const [showDenied, setShowDenied] = React.useState(false);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/');
            } else if (user?.role !== 'admin') {
                setShowDenied(true);
                setTimeout(() => router.push('/'), 2000);
            }
        }
    }, [user, isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center font-mono text-neon-green">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="animate-pulse">VERIFYING CLEARANCE...</p>
                </div>
            </div>
        );
    }

    if (showDenied) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center font-mono text-red-500">
                <div className="text-center">
                    <h1 className="text-4xl mb-2">ACCESS_DENIED</h1>
                    <p>INSUFFICIENT SECURITY CLEARANCE</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') return null; // Wait for redirect

    return <>{children}</>;
};

export default AdminGuard;
