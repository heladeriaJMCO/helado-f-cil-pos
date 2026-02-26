import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { ListOrdered, Plus, Edit2 } from 'lucide-react';
import type { PriceList } from '@/types';
import { toast } from 'sonner';

const PriceLists = () => {
  const { priceLists, addPriceList, updatePriceList } = useDataStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PriceList | null>(null);
  const [form, setForm] = useState({ name: '', key: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', key: '' }); setShowForm(true); };
  const openEdit = (pl: PriceList) => { setEditing(pl); setForm({ name: pl.name, key: pl.key }); setShowForm(true); };

  const handleSave = () => {
    if (!form.name || !form.key) return;
    if (editing) {
      updatePriceList({ ...editing, ...form });
      toast.success('Lista actualizada');
    } else {
      addPriceList({ id: crypto.randomUUID(), ...form, active: true });
      toast.success('Lista creada');
    }
    setShowForm(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListOrdered className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Listas de Precios</h1>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity touch-target">
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-xl pos-shadow-lg p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">{editing ? 'Editar' : 'Nueva'} Lista</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre (ej: Mostrador)" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="Clave interna (ej: mostrador)" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {priceLists.map(pl => (
          <div key={pl.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border pos-shadow">
            <div className="flex-1">
              <p className="font-medium text-foreground">{pl.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{pl.key}</p>
            </div>
            <button onClick={() => updatePriceList({ ...pl, active: !pl.active })} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${pl.active ? 'border-success/30 text-success' : 'border-border text-muted-foreground'}`}>
              {pl.active ? 'Activa' : 'Inactiva'}
            </button>
            <button onClick={() => openEdit(pl)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceLists;
