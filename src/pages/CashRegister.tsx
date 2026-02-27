import { useState, useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { attemptSync } from '@/lib/syncService';
import { Wallet, Plus, Minus, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CashRegister = () => {
  const user = useAuthStore(s => s.user);
  const currentSessionId = useAuthStore(s => s.currentSessionId);
  const { cashRegisters, cashMovements, sales, addCashRegister, closeCashRegister, addCashMovement, getOpenRegister } = useDataStore();

  const openRegister = getOpenRegister(user?.id ?? '');

  // Get last closed register's closing amount as default opening
  const lastClosedRegister = useMemo(() => {
    const closed = cashRegisters
      .filter(cr => cr.userId === (user?.id ?? '') && cr.status === 'closed' && cr.closingAmount != null)
      .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));
    return closed[0] ?? null;
  }, [cashRegisters, user]);

  const defaultOpeningAmount = lastClosedRegister?.closingAmount ?? 0;
  const [openingAmount, setOpeningAmount] = useState(defaultOpeningAmount);
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [movementAmount, setMovementAmount] = useState(0);
  const [movementDesc, setMovementDesc] = useState('');
  const [closingAmount, setClosingAmount] = useState(0);

  const registerMovements = openRegister
    ? cashMovements.filter(m => m.cashRegisterId === openRegister.id)
    : [];

  const registerSales = openRegister
    ? sales.filter(s => s.cashRegisterId === openRegister.id)
    : [];

  // Cash-only calculations for arqueo
  const totalSalesCash = registerSales.filter(s => !s.reversed).reduce((sum, s) => {
    return sum + s.payments.filter(p => p.method === 'cash').reduce((ps, p) => ps + p.amount, 0);
  }, 0);
  const totalIncome = registerMovements.filter(m => m.type === 'income' && !m.reversed).reduce((sum, m) => sum + m.amount, 0);
  const totalExpense = registerMovements.filter(m => m.type === 'expense' && !m.reversed).reduce((sum, m) => sum + m.amount, 0);
  const expectedAmount = (openRegister?.openingAmount ?? 0) + totalSalesCash + totalIncome - totalExpense;

  const handleOpen = () => {
    const newRegister = {
      id: crypto.randomUUID(),
      branchId: user?.branchId ?? '1',
      userId: user?.id ?? '',
      openedAt: new Date().toISOString(),
      openingAmount: defaultOpeningAmount,
      status: 'open' as const,
      synced: false,
    };

    addCashRegister(newRegister);

    // If user entered a different amount, generate adjustment movement
    const diff = openingAmount - defaultOpeningAmount;
    if (diff !== 0) {
      addCashMovement({
        id: crypto.randomUUID(),
        cashRegisterId: newRegister.id,
        type: diff > 0 ? 'income' : 'expense',
        amount: Math.abs(diff),
        description: `Ajuste de apertura (diferencia: $${diff.toLocaleString()})`,
        createdAt: new Date().toISOString(),
        loginSessionId: currentSessionId ?? '',
      });
    }

    toast.success('Caja abierta');
    setOpeningAmount(0);
  };

  const handleAddMovement = () => {
    if (!openRegister || movementAmount <= 0 || !movementDesc) return;
    addCashMovement({
      id: crypto.randomUUID(),
      cashRegisterId: openRegister.id,
      type: movementType,
      amount: movementAmount,
      description: movementDesc,
      createdAt: new Date().toISOString(),
      loginSessionId: currentSessionId ?? '',
    });
    toast.success(`${movementType === 'income' ? 'Ingreso' : 'Egreso'} registrado`);
    setMovementAmount(0);
    setMovementDesc('');
  };

  const handleClose = async () => {
    if (!openRegister) return;
    closeCashRegister(openRegister.id, closingAmount);
    toast.success('Caja cerrada');
    setClosingAmount(0);

    toast.info('Intentando sincronizar datos...');
    const ok = await attemptSync();
    if (ok) {
      toast.success('Datos sincronizados con el servidor');
    } else {
      toast.warning('No se pudo sincronizar. Se reintentará automáticamente.');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Control de Caja</h1>
      </div>

      {!openRegister ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center pos-shadow animate-fade-in">
          <Wallet className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No hay caja abierta</h2>
          <p className="text-sm text-muted-foreground mb-2">
            {defaultOpeningAmount > 0
              ? `Último cierre: $${defaultOpeningAmount.toLocaleString()}`
              : 'Ingresa el monto inicial para abrir tu caja'}
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Confirmá o corregí el monto. Si difiere se generará un movimiento de ajuste.
          </p>
          <div className="max-w-xs mx-auto space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Monto de apertura</label>
              <input
                type="number"
                min="0"
                value={openingAmount || ''}
                onChange={e => setOpeningAmount(Number(e.target.value))}
                className="w-full mt-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="$0"
              />
            </div>
            <button onClick={handleOpen} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity touch-target">
              Abrir Caja
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Apertura', value: openRegister.openingAmount, icon: <Clock className="w-4 h-4" />, color: 'text-info' },
              { label: 'Ventas (Efvo)', value: totalSalesCash, icon: <DollarSign className="w-4 h-4" />, color: 'text-success' },
              { label: 'Ingresos', value: totalIncome, icon: <Plus className="w-4 h-4" />, color: 'text-accent' },
              { label: 'Egresos', value: totalExpense, icon: <Minus className="w-4 h-4" />, color: 'text-destructive' },
            ].map(item => (
              <div key={item.label} className="bg-card rounded-xl border border-border p-4 pos-shadow">
                <div className={`flex items-center gap-1.5 text-xs ${item.color} mb-1`}>
                  {item.icon}
                  {item.label}
                </div>
                <p className="text-xl font-bold text-foreground">${item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-muted-foreground">Efectivo esperado en caja</span>
              <span className="text-2xl font-bold text-primary">${expectedAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">{registerSales.filter(s => !s.reversed).length} ventas en este turno</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
            <h3 className="font-semibold text-foreground mb-3">Registrar Movimiento</h3>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setMovementType('income')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${movementType === 'income' ? 'border-success bg-success/10 text-success' : 'border-border text-muted-foreground'}`}>
                <Plus className="w-4 h-4 inline mr-1" /> Ingreso
              </button>
              <button onClick={() => setMovementType('expense')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${movementType === 'expense' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-muted-foreground'}`}>
                <Minus className="w-4 h-4 inline mr-1" /> Egreso
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="number" min="0" value={movementAmount || ''} onChange={e => setMovementAmount(Number(e.target.value))} className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Monto" />
              <input value={movementDesc} onChange={e => setMovementDesc(e.target.value)} className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Descripción" />
            </div>
            <button onClick={handleAddMovement} disabled={movementAmount <= 0 || !movementDesc} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              Registrar
            </button>
          </div>

          {registerMovements.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 pos-shadow">
              <h3 className="font-semibold text-foreground mb-3">Movimientos del turno</h3>
              <div className="space-y-2">
                {registerMovements.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{m.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <span className={`text-sm font-semibold ${m.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {m.type === 'income' ? '+' : '-'}${m.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border border-destructive/20 p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Cerrar Caja
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">Monto real en caja (efectivo)</label>
                <input type="number" min="0" value={closingAmount || ''} onChange={e => setClosingAmount(Number(e.target.value))} className="w-full mt-1 px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="$0" />
              </div>
              <button onClick={handleClose} className="px-6 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Cerrar
              </button>
            </div>
            {closingAmount > 0 && (
              <p className={`text-sm mt-2 ${closingAmount === expectedAmount ? 'text-success' : 'text-warning'}`}>
                Diferencia: ${(closingAmount - expectedAmount).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister;
