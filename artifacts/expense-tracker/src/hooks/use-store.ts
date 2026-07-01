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

import { useState, useEffect, useCallback } from "react";

const STORE_KEY = "expense-tracker-data";

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DATA: AppData = {
  transactions: [
    { id: "1", amount: 3500, type: "income", category: "Salary", description: "Monthly Salary", date: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "2", amount: 45.5, type: "expense", category: "Food & Dining", description: "Dinner with friends", date: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "3", amount: 1200, type: "expense", category: "Housing", description: "Rent", date: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date().toISOString() },
    { id: "4", amount: 60, type: "expense", category: "Transportation", description: "Gas", date: new Date(Date.now() - 86400000 * 2).toISOString(), createdAt: new Date().toISOString() },
    { id: "5", amount: 150, type: "expense", category: "Utilities", description: "Electric Bill", date: new Date(Date.now() - 86400000 * 3).toISOString(), createdAt: new Date().toISOString() },
    { id: "6", amount: 400, type: "income", category: "Freelance", description: "Logo Design", date: new Date(Date.now() - 86400000 * 4).toISOString(), createdAt: new Date().toISOString() },
    { id: "7", amount: 120, type: "expense", category: "Shopping", description: "New shoes", date: new Date(Date.now() - 86400000 * 5).toISOString(), createdAt: new Date().toISOString() },
    { id: "8", amount: 85, type: "expense", category: "Entertainment", description: "Concert tickets", date: new Date(Date.now() - 86400000 * 6).toISOString(), createdAt: new Date().toISOString() },
    { id: "9", amount: 35, type: "expense", category: "Food & Dining", description: "Groceries", date: new Date(Date.now() - 86400000 * 7).toISOString(), createdAt: new Date().toISOString() },
    { id: "10", amount: 200, type: "expense", category: "Investment", description: "Stock purchase", date: new Date(Date.now() - 86400000 * 8).toISOString(), createdAt: new Date().toISOString() },
  ],
  budgets: [
    { id: "b1", category: "Food & Dining", limit: 500, month: new Date().toISOString().slice(0, 7) },
    { id: "b2", category: "Transportation", limit: 200, month: new Date().toISOString().slice(0, 7) },
    { id: "b3", category: "Entertainment", limit: 150, month: new Date().toISOString().slice(0, 7) }
  ]
};

export function useStore() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as AppData;
      } catch (e) {
        return INITIAL_DATA;
      }
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
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
