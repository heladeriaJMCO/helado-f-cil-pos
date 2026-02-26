import { useState, useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { BarChart3, Download, Calendar } from 'lucide-react';

const Reports = () => {
  const { sales, cashMovements, cashRegisters } = useDataStore();
  const [tab, setTab] = useState<'sales' | 'cash' | 'payments'>('sales');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const d = s.createdAt.split('T')[0];
      return d >= dateFrom && d <= dateTo;
    });
  }, [sales, dateFrom, dateTo]);

  const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const salesByPayment = useMemo(() => {
    const map: Record<string, number> = { cash: 0, card: 0, transfer: 0 };
    filteredSales.forEach((s) => s.payments.forEach((p) => {map[p.method] = (map[p.method] || 0) + p.amount;}));
    return map;
  }, [filteredSales]);

  const paymentLabels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };

  const exportCSV = () => {
    const rows = [['Fecha', 'Total', 'Descuento', 'Items', 'Medios de Pago']];
    filteredSales.forEach((s) => {
      rows.push([
      new Date(s.createdAt).toLocaleString(),
      s.total.toString(),
      s.discount.toString(),
      s.items.map((i) => `${i.productName}x${i.quantity}`).join('; '),
      s.payments.map((p) => `${paymentLabels[p.method]}: $${p.amount}`).join('; ')]
      );
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;a.download = `ventas_${dateFrom}_${dateTo}.csv`;a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Reportes</h1>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <span className="text-muted-foreground">—</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors ml-auto">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {[
        { key: 'sales' as const, label: 'Ventas' },
        { key: 'payments' as const, label: 'Por Medio de Pago' },
        { key: 'cash' as const, label: 'Movimientos de Caja' }].
        map((t) =>
        <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-card text-foreground pos-shadow' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
          <p className="text-xs text-muted-foreground">Total Ventas</p>
          <p className="text-2xl font-bold text-primary">${totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
          <p className="text-xs text-muted-foreground">Cantidad</p>
          <p className="text-2xl font-bold text-foreground">{filteredSales.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
          <p className="text-xs text-muted-foreground">Promedio</p>
          <p className="text-2xl font-bold text-foreground">${filteredSales.length > 0 ? Math.round(totalSales / filteredSales.length).toLocaleString() : 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
          <p className="text-xs text-muted-foreground">Descuentos</p>
          <p className="text-2xl font-bold text-destructive">${filteredSales.reduce((s, v) => s + v.discount, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Content */}
      {tab === 'sales' &&
      <div className="bg-card rounded-xl border border-border pos-shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Items</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Pago</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ?
            <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No hay ventas en este período</td></tr> :
            filteredSales.map((s) =>
            <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 text-sm text-foreground py-[8px]">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{s.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">${s.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground text-right hidden sm:table-cell">{s.payments.map((p) => paymentLabels[p.method]).join(' + ')}</td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }

      {tab === 'payments' &&
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(salesByPayment).map(([method, amount]) =>
        <div key={method} className="bg-card rounded-xl border border-border p-6 pos-shadow text-center">
              <p className="text-sm text-muted-foreground mb-1">{paymentLabels[method]}</p>
              <p className="text-3xl font-bold text-foreground">${amount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{totalSales > 0 ? Math.round(amount / totalSales * 100) : 0}%</p>
            </div>
        )}
        </div>
      }

      {tab === 'cash' &&
      <div className="bg-card rounded-xl border border-border pos-shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Descripción</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Monto</th>
              </tr>
            </thead>
            <tbody>
              {cashMovements.length === 0 ?
            <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No hay movimientos</td></tr> :
            cashMovements.map((m) =>
            <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${m.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{m.type === 'income' ? 'Ingreso' : 'Egreso'}</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{m.description}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">${m.amount.toLocaleString()}</td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }
    </div>);

};

export default Reports;