import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (roles: Role[]) => boolean;
}

// Mock users
const MOCK_USERS: (User & { password: string })[] = [
  { id: '1', name: 'Admin', email: 'admin@heladeria.com', password: 'admin123', role: 'admin', branchId: '1', active: true },
  { id: '2', name: 'Encargado', email: 'encargado@heladeria.com', password: 'enc123', role: 'manager', branchId: '1', active: true },
  { id: '3', name: 'Vendedor', email: 'vendedor@heladeria.com', password: 'vend123', role: 'seller', branchId: '1', active: true },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (email: string, password: string) => {
        const found = MOCK_USERS.find(u => u.email === email && u.password === password);
        if (found) {
          const { password: _, ...user } = found;
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      hasPermission: (roles: Role[]) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },
    }),
    { name: 'heladeria-auth' }
  )
);
