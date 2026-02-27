import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  IceCream, ShoppingCart, Wallet, Package, Tag, ListOrdered,
  BarChart3, LogOut, Menu, Settings, Users, Receipt,
  Wifi, WifiOff, ChevronRight
} from 'lucide-react';
import { startSyncSchedule, stopSyncSchedule } from '@/lib/syncService';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: '/pos', label: 'Punto de Venta', icon: <ShoppingCart className="w-5 h-5" />, roles: ['admin', 'seller'] },
  { to: '/caja', label: 'Control de Caja', icon: <Wallet className="w-5 h-5" />, roles: ['admin', 'seller'] },
  { to: '/caja-detalle', label: 'Detalle de Caja', icon: <Receipt className="w-5 h-5" />, roles: ['admin', 'seller'] },
  { to: '/productos', label: 'Productos', icon: <Package className="w-5 h-5" />, roles: ['admin', 'manager'] },
  { to: '/categorias', label: 'Categorías', icon: <Tag className="w-5 h-5" />, roles: ['admin', 'manager'] },
  { to: '/listas-precios', label: 'Listas de Precios', icon: <ListOrdered className="w-5 h-5" />, roles: ['admin'] },
  { to: '/reportes', label: 'Reportes', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'manager'] },
  { to: '/usuarios', label: 'Usuarios', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
  { to: '/configuraciones', label: 'Configuraciones', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
];

const roleLabels: Record<Role, string> = { admin: 'Administrador', manager: 'Encargado', seller: 'Vendedor' };

const AppLayout = () => {
  const { user, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Start sync schedule
  useEffect(() => {
    startSyncSchedule();
    return () => stopSyncSchedule();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = navItems.filter(item => hasPermission(item.roles));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <IceCream className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">Heladería POS</h2>
            <p className="text-xs text-sidebar-foreground/60">{user?.name} · {roleLabels[user?.role ?? 'seller']}</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${online ? 'text-success' : 'text-warning'}`}>
            {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {online ? 'Conectado' : 'Sin conexión'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center px-4 border-b border-border bg-card lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="ml-3 font-display font-semibold text-foreground">Heladería POS</h1>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
