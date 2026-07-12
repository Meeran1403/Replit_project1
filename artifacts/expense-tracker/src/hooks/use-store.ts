import { syncTransactionToSheet } from "@/lib/sheetSync";
import { useState, useEffect, useCallback } from "react";
import {
  getHandleFromDB,
  saveHandleToDB,
  readFromFile,
  writeToFile,
  checkPermission,
  requestPermission,
  pickSaveFile,
  supportsFileSystem,
} from "@/lib/storage";

export { supportsFileSystem };

export type TransactionType = "income" | "expense";

export type Category =
  | "Food & Dining"
  | "Transportation"
  | "Housing"
  | "Entertainment"
  | "Healthcare"
  | "Shopping"
  | "Education"
  | "Travel"
  | "Utilities"
  | "Salary"
  | "Freelance"
  | "Investment"
  | "Savings"
  | "Junk Food"
  | "Recharge"
  | "Movies"
  | "Groceries"
  | "Other";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  note: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  month: string;
}

export interface AppData {
  transactions: Transaction[];
  budgets: Budget[];
}

// ── Module-level observable store ────────────────────────────────────────────
const STORE_KEY = "expense-tracker-data";
const SETTINGS_KEY = "expense-tracker-settings";

const EMPTY_DATA: AppData = { transactions: [], budgets: [] };

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((fn) => fn()); }

let _data: AppData = EMPTY_DATA;
let _isLoading = true;
let _needsReconnect = false;
let _fileHandle: FileSystemFileHandle | null = null;
let _loadPromise: Promise<void> | null = null;

function getStorageType(): "localStorage" | "filesystem" {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw).storageType ?? "localStorage";
  } catch {}
  return "localStorage";
}

/** Migrate old data shapes (e.g. description→note). */
function migrateData(raw: unknown): AppData {
  const d = (raw ?? {}) as any;
  return {
    transactions: (d.transactions ?? []).map((tx: any) => ({
      ...tx,
      note: tx.note ?? tx.description ?? "",
    })),
    budgets: d.budgets ?? [],
  };
}

async function loadData(): Promise<void> {
  const storageType = getStorageType();
  if (storageType === "filesystem") {
    const handle = await getHandleFromDB();
    if (handle) {
      const perm = await checkPermission(handle);
      if (perm === "granted") {
        const text = await readFromFile(handle);
        if (text) {
          try { _data = migrateData(JSON.parse(text)); } catch { _data = EMPTY_DATA; }
        }
        _fileHandle = handle;
        _needsReconnect = false;
      } else if (perm === "prompt") {
        _fileHandle = handle;
        _needsReconnect = true;
      } else {
        _data = readFromLocalStorage();
      }
    } else {
      _data = readFromLocalStorage();
    }
  } else {
    _data = readFromLocalStorage();
  }
  _isLoading = false;
  notify();
}

function readFromLocalStorage(): AppData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return migrateData(JSON.parse(raw));
  } catch {}
  return EMPTY_DATA;
}

async function persistData(data: AppData): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  if (_fileHandle) {
    await writeToFile(_fileHandle, json);
  } else {
    localStorage.setItem(STORE_KEY, json);
  }
}

/** Call once (from onboarding) to wipe any existing data and start fresh. */
export function resetStore(): void {
  localStorage.removeItem(STORE_KEY);
  _data = { ...EMPTY_DATA };
  _loadPromise = null;
  _fileHandle = null;
  _needsReconnect = false;
  notify();
}

/** Call once (from onboarding) to link a user-chosen file as the data store. */
export async function initFileStorage(): Promise<boolean> {
  const handle = await pickSaveFile();
  if (!handle) return false;
  await saveHandleToDB(handle);
  _fileHandle = handle;
  _needsReconnect = false;
  // Write current data to file
  await persistData(_data);
  notify();
  return true;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

// ── React hook ───────────────────────────────────────────────────────────────

export function useStore() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const rerender = () => forceUpdate((n) => n + 1);
    listeners.add(rerender);

    // Kick off load once
    if (!_loadPromise) {
      _loadPromise = loadData();
    } else if (!_isLoading) {
      // Already loaded; just re-render with current state
    }

    return () => { listeners.delete(rerender); };
  }, []);

  const save = useCallback(async (newData: AppData) => {
    _data = newData;
    notify();
    await persistData(newData);
  }, []);

  const reconnect = useCallback(async () => {
    if (!_fileHandle) return false;
    const perm = await requestPermission(_fileHandle);
    if (perm === "granted") {
      const text = await readFromFile(_fileHandle);
      if (text) {
        try { _data = JSON.parse(text); } catch {}
      }
      _needsReconnect = false;
      notify();
      return true;
    }
    return false;
  }, []);

  return {
    data: _data,
    isLoading: _isLoading,
    needsReconnect: _needsReconnect,
    reconnect,

    addTransaction: useCallback(
      async (t: Omit<Transaction, "id" | "createdAt">) => {
        const newData: AppData = {
          ..._data,
          transactions: [
            { ...t, id: generateId(), createdAt: new Date().toISOString() },
            ..._data.transactions,
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
        await save(newData);
        if (t.type === "expense") {
          syncTransactionToSheet({ date: t.date, category: t.category, amount: t.amount });
        }
      },
      [save]
    ),

    updateTransaction: useCallback(
      async (id: string, t: Partial<Omit<Transaction, "id" | "createdAt">>) => {
        const newData: AppData = {
          ..._data,
          transactions: _data.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...t } : tx
          ),
        };
        await save(newData);
      },
      [save]
    ),

    deleteTransaction: useCallback(
      async (id: string) => {
        const newData: AppData = {
          ..._data,
          transactions: _data.transactions.filter((tx) => tx.id !== id),
        };
        await save(newData);
      },
      [save]
    ),

    setBudget: useCallback(
      async (b: Omit<Budget, "id">) => {
        const existing = _data.budgets.find(
          (budget) => budget.category === b.category && budget.month === b.month
        );
        let newBudgets;
        if (existing) {
          newBudgets = _data.budgets.map((budget) =>
            budget.id === existing.id ? { ...budget, limit: b.limit } : budget
          );
        } else {
          newBudgets = [..._data.budgets, { ...b, id: generateId() }];
        }
        await save({ ..._data, budgets: newBudgets });
      },
      [save]
    ),

    deleteBudget: useCallback(
      async (id: string) => {
        await save({ ..._data, budgets: _data.budgets.filter((b) => b.id !== id) });
      },
      [save]
    ),

    bulkAddTransactions: useCallback(
      async (txs: Omit<Transaction, "id" | "createdAt">[]) => {
        const newTransactions = txs.map((t) => ({
          ...t,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }));
        const newData: AppData = {
          ..._data,
          transactions: [..._data.transactions, ...newTransactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        };
        await save(newData);
      },
      [save]
    ),
  };
}
