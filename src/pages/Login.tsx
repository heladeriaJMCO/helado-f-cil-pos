import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { purgeOldLocalData } from '@/lib/syncService';
import { IceCream, Lock, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(s => s.login);
  const users = useAuthStore(s => s.users);
  const navigate = useNavigate();

  const handleLogin = (em: string, pw: string) => {
    setError('');
    if (login(em, pw)) {
      // Purge old data after login
      purgeOldLocalData();
      navigate('/pos');
    } else {
      setError('Credenciales inválidas');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  // Quick login buttons for first 3 users
  const quickUsers = users.filter(u => u.active).slice(0, 3);
  const roleIcons: Record<string, string> = { admin: '👑', manager: '📋', seller: '🛒' };
  const roleNames: Record<string, string> = { admin: 'Admin', manager: 'Encargado', seller: 'Vendedor' };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
            <IceCream className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Heladería POS</h1>
          <p className="text-muted-foreground mt-2">Sistema de gestión de ventas</p>
        </div>

        <div className="bg-card rounded-xl pos-shadow-lg p-8 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring touch-target"
                  placeholder="correo@heladeria.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring touch-target"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity touch-target"
            >
              Iniciar Sesión
            </button>
          </form>

          {quickUsers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 text-center">Acceso rápido</p>
              <div className="grid grid-cols-3 gap-2">
                {quickUsers.map(u => (
                  <button
                    key={u.email}
                    onClick={() => handleLogin(u.email, u.password)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                  >
                    <span className="text-xl">{roleIcons[u.role] ?? '👤'}</span>
                    <span className="text-foreground font-medium">{roleNames[u.role] ?? u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
