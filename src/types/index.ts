export type Role = 'admin' | 'manager' | 'seller';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string;
  active: boolean;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  stock: number;
  unit: string;
  active: boolean;
  image?: string;
}

export interface PriceList {
  id: string;
  name: string;
  key: string;
  active: boolean;
}

export interface ProductPrice {
  productId: string;
  priceListId: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

export interface Sale {
  id: string;
  branchId: string;
  userId: string;
  cashRegisterId: string;
  loginSessionId: string;
  items: SaleItem[];
  payments: PaymentSplit[];
  subtotal: number;
  discount: number;
  deliveryCost: number;
  isDelivery: boolean;
  total: number;
  priceListId: string;
  createdAt: string;
  synced: boolean;
  reversed: boolean;
  reversedSaleId?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CashRegister {
  id: string;
  branchId: string;
  userId: string;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  status: 'open' | 'closed';
}

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  createdAt: string;
  loginSessionId?: string;
  reversed?: boolean;
  reversedMovementId?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'in' | 'out' | 'sale';
  description: string;
  createdAt: string;
}

export interface LoginSession {
  id: string;
  userId: string;
  userName: string;
  loginAt: string;
}

export interface CompanyConfig {
  branchNumber: string;
  fantasyName: string;
  legalName: string;
  startDate: string;
  cuit: string;
  posNumber: string;
  address: string;
  deliveryCost: number;
  serverIP: string;
  lastSyncDate: string;
}
