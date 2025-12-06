import { create } from 'zustand';

const useUserStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Initial load is true
    error: null,

    setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, error: null }),
    logout: async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout error', e);
        }
        set({ user: null, isAuthenticated: false, error: null });
    },

    fetchUser: async () => {
        // If already loading (and not the initial load), decide if we want to allow it.
        // But for initial load, we want to proceed.
        // Let's just set loading true.
        set({ isLoading: true, error: null });

        try {
            // Add a timeout to the fetch to prevent indefinite hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const res = await fetch('/api/auth/me', { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                set({ user: data.user, isAuthenticated: true });
            } else if (res.status === 401) {
                set({ user: null, isAuthenticated: false });
            } else {
                console.warn('Current user fetch failed with status:', res.status);
                set({ user: null, isAuthenticated: false, error: `Error ${res.status}` });
            }
        } catch (err) {
            console.error('Fetch user error:', err);
            // Don't set error for aborts/timeouts if we just want to show "not logged in" state, 
            // but here it's safer to assume not authenticated.
            set({ user: null, isAuthenticated: false, error: err.message });
        } finally {
            set({ isLoading: false });
        }
    },
}));

export default useUserStore;
