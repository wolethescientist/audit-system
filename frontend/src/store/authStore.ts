import { create } from 'zustand';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isInitialized: false,
  setAuth: (user: User, token: string) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  initializeAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      set({ isInitialized: true });
      return;
    }

    try {
      // Dynamic import to avoid circular dependency
      const { api } = await import('@/lib/api');
      const response = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data, token, isInitialized: true });
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem('token');
      set({ user: null, token: null, isInitialized: true });
    }
  },
}));
