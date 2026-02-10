import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Account, Budget, Category, Goal, Transaction, UserProfile } from './types';

interface FinanceDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
  };
  accounts: {
    key: string;
    value: Account;
  };
  categories: {
    key: string;
    value: Category;
  };
  goals: {
    key: string;
    value: Goal;
  };
  budgets: {
    key: string; // categoryId
    value: Budget;
  };
  system: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'meu-dinheiro-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FinanceDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FinanceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'categoryId' });
        }
        if (!db.objectStoreNames.contains('system')) {
          db.createObjectStore('system');
        }
      },
    });
  }
  return dbPromise;
};

// --- DATA ACCESS LAYER ---

export const dbAPI = {
  async getAll<T>(storeName: any): Promise<T[]> {
    const db = await initDB();
    return db.getAll(storeName);
  },

  async get<T>(storeName: any, key: string): Promise<T | undefined> {
    const db = await initDB();
    return db.get(storeName, key);
  },

  async put(storeName: any, value: any, key?: any) {
    const db = await initDB();
    return db.put(storeName, value, key);
  },

  async delete(storeName: any, key: string) {
    const db = await initDB();
    return db.delete(storeName, key);
  },

  async clearStore(storeName: any) {
    const db = await initDB();
    return db.clear(storeName);
  },
  
  // Batch operations for import/reset
  async replaceAll(storeName: any, items: any[]) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.store.clear();
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
  }
};

// --- MIGRATION UTILS ---

export const migrateFromLocalStorage = async () => {
  const db = await initDB();
  
  // Check if migration already happened
  const migrated = await db.get('system', 'migrated_v1');
  if (migrated) return;

  console.log("Iniciando migração do LocalStorage para IndexedDB...");

  const ls_user = localStorage.getItem('md_user');
  const ls_accounts = localStorage.getItem('md_accounts');
  const ls_categories = localStorage.getItem('md_categories');
  const ls_transactions = localStorage.getItem('md_transactions');
  const ls_goals = localStorage.getItem('md_goals');
  const ls_budgets = localStorage.getItem('md_budgets');

  const tx = db.transaction(
    ['system', 'accounts', 'categories', 'transactions', 'goals', 'budgets'], 
    'readwrite'
  );

  if (ls_user) await tx.objectStore('system').put(JSON.parse(ls_user), 'user');
  
  if (ls_accounts) {
    const items = JSON.parse(ls_accounts);
    for (const i of items) await tx.objectStore('accounts').put(i);
  }
  
  if (ls_categories) {
    const items = JSON.parse(ls_categories);
    for (const i of items) await tx.objectStore('categories').put(i);
  }

  if (ls_transactions) {
    const items = JSON.parse(ls_transactions);
    for (const i of items) await tx.objectStore('transactions').put(i);
  }

  if (ls_goals) {
    const items = JSON.parse(ls_goals);
    for (const i of items) await tx.objectStore('goals').put(i);
  }

  if (ls_budgets) {
    const items = JSON.parse(ls_budgets);
    for (const i of items) await tx.objectStore('budgets').put(i);
  }

  await tx.objectStore('system').put(true, 'migrated_v1');
  await tx.done;

  console.log("Migração concluída.");
  
  // Optional: Clear LocalStorage after successful migration
  // localStorage.removeItem('md_user');
  // ...
};