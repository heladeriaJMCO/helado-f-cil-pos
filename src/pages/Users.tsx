import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Users as UsersIcon, Plus, Edit2 } from 'lucide-react';
import type { Role, UserWithPassword } from '@/types';
import { toast } from 'sonner';

const roleLabels: Record<Role, string> = { admin: 'Administrador', manager: 'Encargado', seller: 'Vendedor' };

const UsersPage = () => {
  const { users, addUser, updateUser } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserWithPassword | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seller' as Role, branchId: '1' });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'seller', branchId: '1' });
    setShowForm(true);
  };

  const openEdit = (u: UserWithPassword) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: u.password, role: u.role, branchId: u.branchId });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email || !form.password) return;
    if (editing) {
      updateUser({ ...editing, ...form });
      toast.success('Usuario actualizado');
    } else {
      addUser({ id: crypto.randomUUID(), ...form, active: true });
      toast.success('Usuario creado');
    }
    setShowForm(false);
  };

  const toggleActive = (u: UserWithPassword) => {
    updateUser({ ...u, active: !u.active });
    toast.success(u.active ? 'Usuario desactivado' : 'Usuario activado');
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Usuarios</h1>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity touch-target">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-xl pos-shadow-lg p-6 w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">{editing ? 'Editar' : 'Nuevo'} Usuario</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Contraseña" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="admin">Administrador</option>
                <option value="manager">Encargado</option>
                <option value="seller">Vendedor</option>
              </select>
              <input value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} placeholder="ID Sucursal" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border pos-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Rol</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{u.email}</td>
                <td className="px-4 py-3 text-sm text-foreground">{roleLabels[u.role]}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(u)} className={`text-xs px-2 py-1 rounded-full ${u.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
