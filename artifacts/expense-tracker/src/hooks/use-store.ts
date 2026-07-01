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
  | "Other";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
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

import { useState, useCallback } from "react";

const STORE_KEY = "expense-tracker-data";

const generateId = () => Math.random().toString(36).substr(2, 9);

const EMPTY_DATA: AppData = {
  transactions: [],
  budgets: [],
};

export function useStore() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as AppData;
      } catch {
        return EMPTY_DATA;
      }
    }
    return EMPTY_DATA;
  });

  const save = useCallback((newData: AppData) => {
    setData(newData);
    localStorage.setItem(STORE_KEY, JSON.stringify(newData));
  }, []);

  return {
    data,
    addTransaction: useCallback((t: Omit<Transaction, "id" | "createdAt">) => {
      save({
        ...data,
        transactions: [
          { ...t, id: generateId(), createdAt: new Date().toISOString() },
          ...data.transactions,
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      });
    }, [data, save]),
    updateTransaction: useCallback((id: string, t: Partial<Omit<Transaction, "id" | "createdAt">>) => {
      save({
        ...data,
        transactions: data.transactions.map((tx) => (tx.id === id ? { ...tx, ...t } : tx)),
      });
    }, [data, save]),
    deleteTransaction: useCallback((id: string) => {
      save({
        ...data,
        transactions: data.transactions.filter((tx) => tx.id !== id),
      });
    }, [data, save]),
    setBudget: useCallback((b: Omit<Budget, "id">) => {
      const existing = data.budgets.find(
        (budget) => budget.category === b.category && budget.month === b.month
      );
      if (existing) {
        save({
          ...data,
          budgets: data.budgets.map((budget) =>
            budget.id === existing.id ? { ...budget, limit: b.limit } : budget
          ),
        });
      } else {
        save({
          ...data,
          budgets: [...data.budgets, { ...b, id: generateId() }],
        });
      }
    }, [data, save]),
    deleteBudget: useCallback((id: string) => {
      save({
        ...data,
        budgets: data.budgets.filter((b) => b.id !== id),
      });
    }, [data, save]),
  };
}
