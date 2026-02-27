import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/idb';
import type { Product, Category, PriceList, ProductPrice, Sale, CashRegister, CashMovement, CompanyConfig } from '@/types';

const SEED_CATEGORIES: Category[] = [
  { id: '1', name: 'Cremas', icon: '🍦', active: true },
  { id: '2', name: 'Paletas', icon: '🍡', active: true },
  { id: '3', name: 'Agua', icon: '🧊', active: true },
  { id: '4', name: 'Postres', icon: '🍰', active: true },
  { id: '5', name: 'Bebidas', icon: '🥤', active: true },
];

const SEED_PRODUCTS: Product[] = [
  { id: '1', name: 'Chocolate', categoryId: '1', stock: 50, unit: 'unidad', active: true },
  { id: '2', name: 'Vainilla', categoryId: '1', stock: 50, unit: 'unidad', active: true },
  { id: '3', name: 'Fresa', categoryId: '1', stock: 45, unit: 'unidad', active: true },
  { id: '4', name: 'Dulce de Leche', categoryId: '1', stock: 40, unit: 'unidad', active: true },
  { id: '5', name: 'Menta Granizada', categoryId: '1', stock: 35, unit: 'unidad', active: true },
  { id: '6', name: 'Limón', categoryId: '3', stock: 60, unit: 'unidad', active: true },
  { id: '7', name: 'Maracuyá', categoryId: '3', stock: 40, unit: 'unidad', active: true },
  { id: '8', name: 'Paleta Frutal', categoryId: '2', stock: 30, unit: 'unidad', active: true },
  { id: '9', name: 'Paleta Crema', categoryId: '2', stock: 25, unit: 'unidad', active: true },
  { id: '10', name: 'Sundae', categoryId: '4', stock: 20, unit: 'unidad', active: true },
  { id: '11', name: 'Banana Split', categoryId: '4', stock: 15, unit: 'unidad', active: true },
  { id: '12', name: 'Milkshake', categoryId: '5', stock: 30, unit: 'unidad', active: true },
];

const SEED_PRICE_LISTS: PriceList[] = [
  { id: '1', name: 'Mostrador', key: 'mostrador', active: true },
  { id: '2', name: 'Delivery', key: 'delivery', active: true },
  { id: '3', name: 'Mayorista', key: 'mayorista', active: true },
];

const SEED_PRICES: ProductPrice[] = SEED_PRODUCTS.flatMap(p => [
  { productId: p.id, priceListId: '1', price: Math.round((Math.random() * 300 + 200) / 50) * 50 },
  { productId: p.id, priceListId: '2', price: Math.round((Math.random() * 350 + 250) / 50) * 50 },
  { productId: p.id, priceListId: '3', price: Math.round((Math.random() * 250 + 150) / 50) * 50 },
]);

const DEFAULT_CONFIG: CompanyConfig = {
  branchNumber: '1',
  fantasyName: 'Heladería Demo',
  legalName: '',
  startDate: '',
  cuit: '',
  posNumber: '1',
  address: '',
  deliveryCost: 500,
  serverIP: '',
  lastSyncDate: '',
};

interface DataState {
  categories: Category[];
  products: Product[];
  priceLists: PriceList[];
  productPrices: ProductPrice[];
  sales: Sale[];
  cashRegisters: CashRegister[];
  cashMovements: CashMovement[];
  companyConfig: CompanyConfig;

  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  updateStock: (productId: string, delta: number) => void;
  addPriceList: (pl: PriceList) => void;
  updatePriceList: (pl: PriceList) => void;
  setProductPrice: (pp: ProductPrice) => void;
  getPrice: (productId: string, priceListId: string) => number;
  addSale: (s: Sale) => void;
  updateSale: (s: Sale) => void;
  addCashRegister: (cr: CashRegister) => void;
  closeCashRegister: (id: string, closingAmount: number) => void;
  addCashMovement: (cm: CashMovement) => void;
  getOpenRegister: (userId: string) => CashRegister | undefined;
  updateCompanyConfig: (config: Partial<CompanyConfig>) => void;
  purgeOldData: (beforeDate: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      categories: SEED_CATEGORIES,
      products: SEED_PRODUCTS,
      priceLists: SEED_PRICE_LISTS,
      productPrices: SEED_PRICES,
      sales: [],
      cashRegisters: [],
      cashMovements: [],
      companyConfig: DEFAULT_CONFIG,

      addCategory: (c) => set(s => ({ categories: [...s.categories, c] })),
      updateCategory: (c) => set(s => ({ categories: s.categories.map(x => x.id === c.id ? c : x) })),

      addProduct: (p) => set(s => ({ products: [...s.products, p] })),
      updateProduct: (p) => set(s => ({ products: s.products.map(x => x.id === p.id ? p : x) })),
      updateStock: (productId, delta) => set(s => ({
        products: s.products.map(p => p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p)
      })),

      addPriceList: (pl) => set(s => ({ priceLists: [...s.priceLists, pl] })),
      updatePriceList: (pl) => set(s => ({ priceLists: s.priceLists.map(x => x.id === pl.id ? pl : x) })),

      setProductPrice: (pp) => set(s => {
        const idx = s.productPrices.findIndex(x => x.productId === pp.productId && x.priceListId === pp.priceListId);
        if (idx >= 0) {
          const updated = [...s.productPrices];
          updated[idx] = pp;
          return { productPrices: updated };
        }
        return { productPrices: [...s.productPrices, pp] };
      }),
      getPrice: (productId, priceListId) => {
        const pp = get().productPrices.find(x => x.productId === productId && x.priceListId === priceListId);
        return pp?.price ?? 0;
      },

      addSale: (s) => set(state => ({ sales: [...state.sales, s] })),
      updateSale: (s) => set(state => ({ sales: state.sales.map(x => x.id === s.id ? s : x) })),

      addCashRegister: (cr) => set(s => ({ cashRegisters: [...s.cashRegisters, cr] })),
      closeCashRegister: (id, closingAmount) => set(s => ({
        cashRegisters: s.cashRegisters.map(cr => cr.id === id ? { ...cr, closedAt: new Date().toISOString(), closingAmount, status: 'closed' as const } : cr)
      })),
      addCashMovement: (cm) => set(s => ({ cashMovements: [...s.cashMovements, cm] })),
      getOpenRegister: (userId) => get().cashRegisters.find(cr => cr.userId === userId && cr.status === 'open'),

      updateCompanyConfig: (config) => set(s => ({ companyConfig: { ...s.companyConfig, ...config } })),

      purgeOldData: (beforeDate) => set(s => ({
        sales: s.sales.filter(sale => sale.createdAt >= beforeDate),
        cashMovements: s.cashMovements.filter(cm => cm.createdAt >= beforeDate),
        cashRegisters: s.cashRegisters.filter(cr => cr.openedAt >= beforeDate || cr.status === 'open'),
      })),
    }),
    {
      name: 'heladeria-data',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
