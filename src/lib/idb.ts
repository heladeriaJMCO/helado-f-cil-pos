import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface HeladeriaDB extends DBSchema {
  config: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
  users: {
    key: string;
    value: {
      id: string;
      name: string;
      email: string;
      password: string;
      role: 'admin' | 'manager' | 'seller';
      branchId: string;
      active: boolean;
    };
  };
  categories: {
    key: string;
    value: {
      id: string;
      name: string;
      icon: string;
      active: boolean;
    };
  };
  products: {
    key: string;
    value: {
      id: string;
      name: string;
      categoryId: string;
      stock: number;
      unit: string;
      active: boolean;
      image?: string;
    };
  };
  priceLists: {
    key: string;
    value: {
      id: string;
      name: string;
      key: string;
      active: boolean;
    };
  };
  productPrices: {
    key: string;
    value: {
      id: string;
      productId: string;
      priceListId: string;
      price: number;
    };
  };
  sales: {
    key: string;
    value: any;
    indexes: { 'by-date': string; 'by-register': string };
  };
  cashRegisters: {
    key: string;
    value: any;
    indexes: { 'by-user': string };
  };
  cashMovements: {
    key: string;
    value: any;
    indexes: { 'by-register': string };
  };
  loginSessions: {
    key: string;
    value: {
      id: string;
      userId: string;
      userName: string;
      loginAt: string;
    };
    indexes: { 'by-user': string };
  };
  zustandState: {
    key: string;
    value: {
      key: string;
      state: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<HeladeriaDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<HeladeriaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HeladeriaDB>('heladeria-pos', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('config', { keyPath: 'key' });
          db.createObjectStore('users', { keyPath: 'id' });
          db.createObjectStore('categories', { keyPath: 'id' });
          db.createObjectStore('products', { keyPath: 'id' });
          db.createObjectStore('priceLists', { keyPath: 'id' });
          db.createObjectStore('productPrices', { keyPath: 'id' });

          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('by-date', 'createdAt');
          salesStore.createIndex('by-register', 'cashRegisterId');

          const crStore = db.createObjectStore('cashRegisters', { keyPath: 'id' });
          crStore.createIndex('by-user', 'userId');

          const cmStore = db.createObjectStore('cashMovements', { keyPath: 'id' });
          cmStore.createIndex('by-register', 'cashRegisterId');

          const lsStore = db.createObjectStore('loginSessions', { keyPath: 'id' });
          lsStore.createIndex('by-user', 'userId');
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('zustandState')) {
            db.createObjectStore('zustandState', { keyPath: 'key' });
          }
        }
      },
    });
  }
  return dbPromise;
}

// Zustand-compatible async storage using a single "zustandState" object store
export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const db = await getDB();
    const row = await db.get('zustandState', name);
    return row?.state ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const db = await getDB();
    await db.put('zustandState', { key: name, state: value });
  },
  removeItem: async (name: string): Promise<void> => {
    const db = await getDB();
    await db.delete('zustandState', name);
  },
};
