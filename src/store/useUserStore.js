
import { create } from 'zustand';

const useUser = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
    logout: () => set({ user: null, isAuthenticated: false }),

    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                set({ user: data.user, isAuthenticated: true });
            } else {
                set({ user: null, isAuthenticated: false });
            }
        } catch (err) {
            console.error(err);
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },
}));

export default useUser;
