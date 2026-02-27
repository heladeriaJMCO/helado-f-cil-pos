import { useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { Receipt, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/types';

const paymentLabels: Record<PaymentMethod, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };

const CashDetail = () => {
  const user = useAuthStore(s => s.user);
  const currentSessionId = useAuthStore(s => s.currentSessionId);
  const { sales, cashMovements, getOpenRegister, addSale, addCashMovement, updateStock } = useDataStore();

  const openRegister = getOpenRegister(user?.id ?? '');

  const registerSales = useMemo(() =>
    openRegister ? sales.filter(s => s.cashRegisterId === openRegister.id) : [],
    [sales, openRegister]
  );

  const registerMovements = useMemo(() =>
    openRegister ? cashMovements.filter(m => m.cashRegisterId === openRegister.id) : [],
    [cashMovements, openRegister]
  );

  const salesByPayment = useMemo(() => {
    const map: Record<string, number> = { cash: 0, card: 0, transfer: 0 };
    registerSales.filter(s => !s.reversed).forEach(s =>
      s.payments.forEach(p => { map[p.method] = (map[p.method] || 0) + p.amount; })
    );
    return map;
  }, [registerSales]);

  const totalUnits = useMemo(() =>
    registerSales.filter(s => !s.reversed).reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0),
    [registerSales]
  );

  const handleReverseSale = (saleId: string) => {
    const original = sales.find(s => s.id === saleId);
    if (!original || original.reversed) {
      toast.error('Venta ya fue revertida');
      return;
    }

    // Create reversed sale
    const reversedSale = {
      ...original,
      id: crypto.randomUUID(),
      items: original.items.map(i => ({ ...i, quantity: -i.quantity, subtotal: -i.subtotal })),
      payments: original.payments.map(p => ({ ...p, amount: -p.amount })),
      subtotal: -original.subtotal,
      discount: -original.discount,
      deliveryCost: -original.deliveryCost,
      total: -original.total,
      createdAt: new Date().toISOString(),
      reversed: false,
      reversedSaleId: original.id,
      loginSessionId: currentSessionId ?? '',
    };

    addSale(reversedSale);

    // Mark original as reversed
    const updatedOriginal = { ...original, reversed: true };
    // We'll just add a flag; the updateSale isn't in store but we can use the state
    useDataStore.setState(s => ({
      sales: s.sales.map(x => x.id === original.id ? updatedOriginal : x)
    }));

    // Restore stock
    original.items.forEach(item => {
      updateStock(item.productId, item.quantity);
    });

    toast.success('Venta revertida. Stock restaurado.');
  };

  const handleReverseMovement = (movementId: string) => {
    const original = cashMovements.find(m => m.id === movementId);
    if (!original || original.reversed) {
      toast.error('Movimiento ya revertido');
      return;
    }

    addCashMovement({
      id: crypto.randomUUID(),
      cashRegisterId: original.cashRegisterId,
      type: original.type === 'income' ? 'expense' : 'income',
      amount: original.amount,
      description: `[REVERSIÓN] ${original.description}`,
      createdAt: new Date().toISOString(),
      loginSessionId: currentSessionId ?? '',
      reversedMovementId: original.id,
    });

    useDataStore.setState(s => ({
      cashMovements: s.cashMovements.map(x => x.id === original.id ? { ...x, reversed: true } : x)
    }));

    toast.success('Movimiento revertido');
  };

  if (!openRegister) {
    return (
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Receipt className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Detalle de Caja</h1>
        </div>
        <div className="bg-card rounded-xl border border-border p-8 text-center pos-shadow">
          <p className="text-muted-foreground">No hay caja abierta</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Detalle de Caja</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
          <p className="text-xs text-muted-foreground">Unidades</p>
          <p className="text-xl font-bold text-foreground">{totalUnits}</p>
        </div>
        {Object.entries(salesByPayment).map(([method, amount]) => (
          <div key={method} className="bg-card rounded-xl border border-border p-4 pos-shadow">
            <p className="text-xs text-muted-foreground">{paymentLabels[method as PaymentMethod]}</p>
            <p className="text-xl font-bold text-foreground">${amount.toLocaleString()}</p>
          </div>
        ))}
        <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
          <p className="text-xs text-muted-foreground">Comprobantes</p>
          <p className="text-xl font-bold text-foreground">{registerSales.length}</p>
        </div>
      </div>

      {/* Sales */}
      <div className="bg-card rounded-xl border border-border pos-shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Comprobantes de Venta</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Hora</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Items</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Uds.</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Total</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Pago</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Acción</th>
            </tr>
          </thead>
          <tbody>
            {registerSales.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Sin ventas</td></tr>
            ) : registerSales.map(s => (
              <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${s.reversed ? 'opacity-50' : ''} ${s.reversedSaleId ? 'bg-destructive/5' : ''}`}>
                <td className="px-4 py-2 text-sm text-foreground">{new Date(s.createdAt).toLocaleTimeString()}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">{s.items.map(i => `${i.productName} x${i.quantity}`).join(', ')}</td>
                <td className="px-4 py-2 text-sm text-right text-foreground">{s.items.reduce((sum, i) => sum + Math.abs(i.quantity), 0)}</td>
                <td className="px-4 py-2 text-sm font-semibold text-right text-foreground">${s.total.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground text-right hidden sm:table-cell">{s.payments.map(p => paymentLabels[p.method]).join(' + ')}</td>
                <td className="px-4 py-2 text-center">
                  {!s.reversed && !s.reversedSaleId && (
                    <button onClick={() => handleReverseSale(s.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Revertir venta">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {s.reversed && <span className="text-xs text-destructive">Revertida</span>}
                  {s.reversedSaleId && <span className="text-xs text-warning">Reversión</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Movements */}
      {registerMovements.length > 0 && (
        <div className="bg-card rounded-xl border border-border pos-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Movimientos de Caja</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Hora</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Descripción</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Monto</th>
                <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground uppercase">Acción</th>
              </tr>
            </thead>
            <tbody>
              {registerMovements.map(m => (
                <tr key={m.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${m.reversed ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 text-sm text-foreground">{new Date(m.createdAt).toLocaleTimeString()}</td>
                  <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${m.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{m.type === 'income' ? 'Ingreso' : 'Egreso'}</span></td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">{m.description}</td>
                  <td className="px-4 py-2 text-sm font-semibold text-right text-foreground">${m.amount.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    {!m.reversed && !m.reversedMovementId && (
                      <button onClick={() => handleReverseMovement(m.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Revertir">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {m.reversed && <span className="text-xs text-destructive">Revertido</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CashDetail;
