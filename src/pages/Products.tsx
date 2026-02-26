import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Package, Plus, Edit2, Search } from 'lucide-react';
import type { Product } from '@/types';
import { toast } from 'sonner';

const Products = () => {
  const { products, categories, priceLists, productPrices, addProduct, updateProduct, setProductPrice, getPrice } = useDataStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', categoryId: '', stock: 0, unit: 'unidad' });
  const [prices, setPrices] = useState<Record<string, number>>({});

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', categoryId: categories[0]?.id ?? '', stock: 0, unit: 'unidad' });
    setPrices({});
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, categoryId: p.categoryId, stock: p.stock, unit: p.unit });
    const priceMap: Record<string, number> = {};
    priceLists.forEach(pl => { priceMap[pl.id] = getPrice(p.id, pl.id); });
    setPrices(priceMap);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.categoryId) return;
    if (editing) {
      updateProduct({ ...editing, ...form });
      Object.entries(prices).forEach(([plId, price]) => setProductPrice({ productId: editing.id, priceListId: plId, price }));
      toast.success('Producto actualizado');
    } else {
      const id = crypto.randomUUID();
      addProduct({ id, ...form, active: true });
      Object.entries(prices).forEach(([plId, price]) => setProductPrice({ productId: id, priceListId: plId, price }));
      toast.success('Producto creado');
    }
    setShowForm(false);
  };

  const toggleActive = (p: Product) => {
    updateProduct({ ...p, active: !p.active });
    toast.success(p.active ? 'Producto desactivado' : 'Producto activado');
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Productos</h1>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity touch-target">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-xl pos-shadow-lg p-6 w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">{editing ? 'Editar' : 'Nuevo'} Producto</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre" className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} placeholder="Stock" className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unidad" className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-2">Precios por lista</p>
              {priceLists.filter(pl => pl.active).map(pl => (
                <div key={pl.id} className="flex items-center gap-3">
                  <span className="text-sm text-foreground flex-1">{pl.name}</span>
                  <input type="number" min="0" value={prices[pl.id] || ''} onChange={e => setPrices(p => ({ ...p, [pl.id]: Number(e.target.value) }))} placeholder="$0" className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="bg-card rounded-xl border border-border pos-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Producto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Categoría</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Precio</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">{cat?.icon} {cat?.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${p.stock <= 5 ? 'text-warning' : 'text-foreground'}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-sm text-foreground">${getPrice(p.id, '1').toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(p)} className={`text-xs px-2 py-1 rounded-full ${p.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
