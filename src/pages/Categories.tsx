import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Tag, Plus, Edit2 } from 'lucide-react';
import type { Category } from '@/types';
import { toast } from 'sonner';

const ICONS = ['🍦', '🍡', '🧊', '🍰', '🥤', '🍫', '🍓', '🍋', '🍌', '🥜', '🫐', '🍒'];

const Categories = () => {
  const { categories, addCategory, updateCategory } = useDataStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🍦' });

  const openNew = () => { setEditing(null); setForm({ name: '', icon: '🍦' }); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, icon: c.icon }); setShowForm(true); };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) {
      updateCategory({ ...editing, ...form });
      toast.success('Categoría actualizada');
    } else {
      addCategory({ id: crypto.randomUUID(), ...form, active: true });
      toast.success('Categoría creada');
    }
    setShowForm(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Categorías</h1>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity touch-target">
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-xl pos-shadow-lg p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">{editing ? 'Editar' : 'Nueva'} Categoría</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Ícono</p>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${form.icon === icon ? 'bg-primary/10 border-2 border-primary' : 'bg-muted hover:bg-muted/80 border border-border'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(c => (
          <div key={c.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border pos-shadow">
            <span className="text-3xl">{c.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-foreground">{c.name}</p>
              <span className={`text-xs ${c.active ? 'text-success' : 'text-muted-foreground'}`}>{c.active ? 'Activa' : 'Inactiva'}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { updateCategory({ ...c, active: !c.active }); }} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${c.active ? 'border-success/30 text-success hover:bg-success/10' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                {c.active ? 'Activa' : 'Inactiva'}
              </button>
              <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
