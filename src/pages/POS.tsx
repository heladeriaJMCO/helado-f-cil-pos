import { useState, useMemo, useCallback } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import type { CartItem, PaymentMethod, PaymentSplit } from '@/types';
import { ShoppingCart, Minus, Plus, Trash2, CreditCard, Banknote, ArrowRightLeft, Percent, Printer, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { method: 'cash', label: 'Efectivo', icon: <Banknote className="w-5 h-5" /> },
  { method: 'card', label: 'Tarjeta', icon: <CreditCard className="w-5 h-5" /> },
  { method: 'transfer', label: 'Transferencia', icon: <ArrowRightLeft className="w-5 h-5" /> },
];

const POS = () => {
  const user = useAuthStore(s => s.user);
  const { categories, products, priceLists, getPrice, addSale, updateStock, getOpenRegister } = useDataStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriceList, setSelectedPriceList] = useState(priceLists.find(p => p.active)?.id ?? '1');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [primaryPayment, setPrimaryPayment] = useState<PaymentMethod>('cash');
  const [secondaryPayment, setSecondaryPayment] = useState<PaymentMethod | null>(null);
  const [secondaryAmount, setSecondaryAmount] = useState(0);

  const activeCategories = useMemo(() => categories.filter(c => c.active), [categories]);
  const activePriceLists = useMemo(() => priceLists.filter(p => p.active), [priceLists]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.active && (!selectedCategory || p.categoryId === selectedCategory));
  }, [products, selectedCategory]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  const addToCart = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const price = getPrice(productId, selectedPriceList);
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing) {
        return prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: price, subtotal: price }];
    });
  }, [products, getPrice, selectedPriceList]);

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(item => {
        if (item.product.id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null as any;
        return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
      })
      .filter(Boolean)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // When price list changes, update prices in cart
  const handlePriceListChange = (priceListId: string) => {
    setSelectedPriceList(priceListId);
    setCart(prev => prev.map(item => {
      const newPrice = getPrice(item.product.id, priceListId);
      return { ...item, unitPrice: newPrice, subtotal: item.quantity * newPrice };
    }));
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    
    const openRegister = getOpenRegister(user?.id ?? '');
    if (!openRegister) {
      toast.error('Debes abrir una caja antes de vender');
      return;
    }

    const payments: PaymentSplit[] = [];
    if (secondaryPayment && secondaryAmount > 0) {
      payments.push({ method: secondaryPayment, amount: secondaryAmount });
      payments.push({ method: primaryPayment, amount: total - secondaryAmount });
    } else {
      payments.push({ method: primaryPayment, amount: total });
    }

    const sale = {
      id: crypto.randomUUID(),
      branchId: user?.branchId ?? '1',
      userId: user?.id ?? '',
      cashRegisterId: openRegister.id,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      payments,
      subtotal,
      discount,
      total,
      priceListId: selectedPriceList,
      createdAt: new Date().toISOString(),
      synced: navigator.onLine,
    };

    // Deduct stock
    cart.forEach(item => updateStock(item.product.id, -item.quantity));
    addSale(sale);

    toast.success(`Venta completada: $${total.toLocaleString()}`);
    setCart([]);
    setDiscount(0);
    setShowPayment(false);
    setSecondaryPayment(null);
    setSecondaryAmount(0);
  };

  return (
    <div className="flex h-full">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={selectedPriceList}
            onChange={e => handlePriceListChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {activePriceLists.map(pl => (
              <option key={pl.id} value={pl.id}>{pl.name}</option>
            ))}
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 flex-shrink-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors touch-target ${
              !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos
          </button>
          {activeCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors touch-target ${
                selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => {
              const price = getPrice(product.id, selectedPriceList);
              const cat = categories.find(c => c.id === product.categoryId);
              const inCart = cart.find(item => item.product.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product.id)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-150 touch-target min-h-[110px] ${
                    inCart
                      ? 'border-primary bg-primary/5 pos-shadow'
                      : 'border-border bg-card hover:border-primary/40 hover:pos-shadow'
                  }`}
                >
                  <span className="text-2xl mb-1">{cat?.icon ?? '🍦'}</span>
                  <span className="text-sm font-medium text-foreground text-center leading-tight">{product.name}</span>
                  <span className="text-sm font-bold text-primary mt-1">${price.toLocaleString()}</span>
                  {inCart && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {inCart.quantity}
                    </span>
                  )}
                  {product.stock <= 5 && (
                    <span className="text-[10px] text-warning mt-0.5">Stock: {product.stock}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Ticket</h2>
          <span className="ml-auto text-sm text-muted-foreground">{cart.length} ítems</span>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Agrega productos al ticket</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border animate-fade-in">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">${item.unitPrice.toLocaleString()} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm font-semibold text-foreground w-16 text-right">${item.subtotal.toLocaleString()}</span>
                <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Payment */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Descuento</span>
            <input
              type="number"
              min="0"
              value={discount || ''}
              onChange={e => setDiscount(Number(e.target.value))}
              className="ml-auto w-24 px-2 py-1.5 text-right rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="$0"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">${subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuento</span>
              <span className="text-destructive">-${discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">${total.toLocaleString()}</span>
          </div>

          {!showPayment ? (
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity touch-target"
            >
              Cobrar ${total.toLocaleString()}
            </button>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Medio de pago principal</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.method}
                    onClick={() => setPrimaryPayment(pm.method)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors touch-target ${
                      primaryPayment === pm.method
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {pm.icon}
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Secondary payment */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Segundo medio (opcional)</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.filter(pm => pm.method !== primaryPayment).map(pm => (
                    <button
                      key={pm.method}
                      onClick={() => setSecondaryPayment(secondaryPayment === pm.method ? null : pm.method)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                        secondaryPayment === pm.method
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted-foreground hover:border-accent/40'
                      }`}
                    >
                      {pm.icon}
                      {pm.label}
                    </button>
                  ))}
                </div>
                {secondaryPayment && (
                  <div className="mt-2">
                    <label className="text-xs text-muted-foreground">Monto segundo medio</label>
                    <input
                      type="number"
                      min="0"
                      max={total}
                      value={secondaryAmount || ''}
                      onChange={e => setSecondaryAmount(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={`Máx $${total.toLocaleString()}`}
                    />
                    {secondaryAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {primaryPayment}: ${(total - secondaryAmount).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPayment(false); setSecondaryPayment(null); setSecondaryAmount(0); }}
                  className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors touch-target"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCompleteSale}
                  className="flex-1 py-3 rounded-lg bg-success text-success-foreground font-semibold hover:opacity-90 transition-opacity touch-target flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
