
import useUserStore from '../store/useUserStore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Layout({ children }) {
  const { user, logout, fetchUser } = useUserStore();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Portfolio', href: '/portfolio', icon: '💼' },
    { name: 'Backtest', href: '/backtest', icon: '🔬' },
    { name: 'Paper Trading', href: '/paper-trading', icon: '📝' },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin', href: '/admin', icon: '⚙️' });
    navigation.push({ name: 'Research', href: '/admin/research', icon: '🧪' });
  }

  const NavItem = ({ item, isMobile = false }) => {
    const isActive = router.pathname === item.href;
    return (
      <Link
        href={item.href}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
          ? 'bg-neon-blue/10 text-neon-blue border-r-2 border-neon-blue'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <span className={`text-xl ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{item.icon}</span>
        <span className="font-mono text-sm tracking-widest uppercase">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans flex">
      {/* Background Gradients */}
      <div className="fixed inset-0 bg-grid opacity-20 z-0 pointer-events-none"></div>
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neon-purple/5 blur-[150px] pointer-events-none"></div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50">
        {/* Logo area */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link href="/">
            <span className="text-xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              ALGO<span className="text-neon-blue">.AI</span>
            </span>
          </Link>
        </div>

        {/* Links */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => <NavItem key={item.name} item={item} />)}
        </nav>

        {/* User / Footer area */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          {user ? (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-blue to-purple-600 flex items-center justify-center text-xs font-bold ring-1 ring-white/20">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-white truncate">{user.email}</p>
                  <p className="text-[10px] text-neon-green uppercase tracking-wider">Online</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
                className="w-full py-2 text-xs font-mono text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10 rounded transition uppercase tracking-widest"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="block w-full text-center py-2 text-xs font-mono text-neon-blue hover:text-white border border-neon-blue/30 hover:bg-neon-blue/10 rounded uppercase">
              Connect System
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-black/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-4">
        <span className="text-lg font-bold font-mono text-white">ALGO<span className="text-neon-blue">.AI</span></span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 z-40 flex flex-col pt-20 px-6 space-y-4 md:hidden">
          {navigation.map((item) => <NavItem key={item.name} item={item} isMobile={true} />)}
          {user && (
            <button onClick={logout} className="mt-8 text-red-500 font-mono text-sm uppercase">Disconnect</button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-64 transition-all duration-300">
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-full mx-auto z-10 relative">
          {children}
        </main>

        <footer className="py-6 text-center text-[10px] text-gray-600 font-mono uppercase tracking-widest border-t border-white/5 mx-8">
          System Status: Nominal • AlgoTrader AI v2.0
        </footer>
      </div>
    </div>
  );
}
