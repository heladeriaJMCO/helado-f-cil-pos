import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/idb';
import type { User, Role, LoginSession, UserWithPassword } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  currentSessionId: string | null;
  users: UserWithPassword[];
  loginSessions: LoginSession[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (roles: Role[]) => boolean;
  addUser: (u: UserWithPassword) => void;
  updateUser: (u: UserWithPassword) => void;
}

const DEFAULT_USERS: UserWithPassword[] = [
  { id: '1', name: 'Admin', email: 'admin@heladeria.com', password: 'admin123', role: 'admin', branchId: '1', active: true },
  { id: '2', name: 'Encargado', email: 'encargado@heladeria.com', password: 'enc123', role: 'manager', branchId: '1', active: true },
  { id: '3', name: 'Vendedor', email: 'vendedor@heladeria.com', password: 'vend123', role: 'seller', branchId: '1', active: true },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      currentSessionId: null,
      users: DEFAULT_USERS,
      loginSessions: [],
      login: (email: string, password: string) => {
        const found = get().users.find(u => u.email === email && u.password === password && u.active);
        if (found) {
          const { password: _, ...user } = found;
          const session: LoginSession = {
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            loginAt: new Date().toISOString(),
          };
          set(s => ({
            user,
            isAuthenticated: true,
            currentSessionId: session.id,
            loginSessions: [...s.loginSessions, session],
          }));
          return true;
        }
        return false;
      },
      logout: () => set({ user: null, isAuthenticated: false, currentSessionId: null }),
      hasPermission: (roles: Role[]) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },
      addUser: (u) => set(s => ({ users: [...s.users, u] })),
      updateUser: (u) => set(s => ({ users: s.users.map(x => x.id === u.id ? u : x) })),
    }),
    {
      name: 'heladeria-auth',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
