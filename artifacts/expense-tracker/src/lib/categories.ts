import {
  Utensils,
  Car,
  Home,
  Film,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Plane,
  Zap,
  Briefcase,
  Laptop,
  TrendingUp,
  MoreHorizontal,
  PiggyBank,
  Cookie,
  Smartphone,
  Clapperboard,
  ShoppingCart,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { Category, TransactionType } from "@/hooks/use-store";

export interface CategoryInfo {
  id: Category;
  icon: LucideIcon;
  color: string;
  type: "income" | "expense" | "both";
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  "Food & Dining":  { id: "Food & Dining",  icon: Utensils,      color: "text-orange-500", type: "expense" },
  "Groceries":      { id: "Groceries",       icon: ShoppingCart,  color: "text-lime-600",   type: "expense" },
  "Junk Food":      { id: "Junk Food",       icon: Cookie,        color: "text-yellow-600", type: "expense" },
  "Transportation": { id: "Transportation",  icon: Car,           color: "text-blue-500",   type: "expense" },
  "Housing":        { id: "Housing",         icon: Home,          color: "text-indigo-500", type: "expense" },
  "Entertainment":  { id: "Entertainment",   icon: Film,          color: "text-purple-500", type: "expense" },
  "Movies":         { id: "Movies",          icon: Clapperboard,  color: "text-violet-500", type: "expense" },
  "Healthcare":     { id: "Healthcare",      icon: HeartPulse,    color: "text-rose-500",   type: "expense" },
  "Shopping":       { id: "Shopping",        icon: ShoppingBag,   color: "text-pink-500",   type: "expense" },
  "Education":      { id: "Education",       icon: GraduationCap, color: "text-amber-500",  type: "expense" },
  "Travel":         { id: "Travel",          icon: Plane,         color: "text-sky-500",    type: "expense" },
  "Utilities":      { id: "Utilities",       icon: Zap,           color: "text-yellow-500", type: "expense" },
  "Recharge":       { id: "Recharge",        icon: Smartphone,    color: "text-cyan-600",   type: "expense" },
  "Salary":         { id: "Salary",          icon: Briefcase,     color: "text-emerald-500",type: "income"  },
  "Freelance":      { id: "Freelance",       icon: Laptop,        color: "text-teal-500",   type: "income"  },
  "Investment":     { id: "Investment",      icon: TrendingUp,    color: "text-cyan-500",   type: "both"    },
  "Savings":        { id: "Savings",         icon: PiggyBank,     color: "text-green-500",  type: "both"    },
  "Other":          { id: "Other",           icon: MoreHorizontal,color: "text-slate-500",  type: "both"    },
};

// ── User-added categories ────────────────────────────────────────────────────
const CUSTOM_KEY = "expense-tracker-custom-categories";

export interface CustomCategory {
  id: string;
  type: "income" | "expense";
}

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((fn) => fn()); }
export function subscribeCategories(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function readCustom(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function writeCustom(list: CustomCategory[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  notify();
}

export function getCustomCategories(): CustomCategory[] {
  return readCustom();
}

/** Adds a new category. Returns false if it already exists (built-in or custom). */
export function addCustomCategory(name: string, type: TransactionType = "expense"): boolean {
  const id = name.trim();
  if (!id) return false;
  if (CATEGORIES[id]) return false;
  const custom = readCustom();
  if (custom.some((c) => c.id.toLowerCase() === id.toLowerCase())) return false;
  writeCustom([...custom, { id, type }]);
  return true;
}

export function removeCustomCategory(id: string): void {
  writeCustom(readCustom().filter((c) => c.id !== id));
}

/** All categories — built-in + user-added — as a flat list for pickers. */
export function getAllCategories(): CategoryInfo[] {
  const custom: CategoryInfo[] = readCustom().map((c) => ({
    id: c.id,
    icon: Tag,
    color: "text-slate-500",
    type: c.type,
  }));
  return [...Object.values(CATEGORIES), ...custom];
}

export function getCategoryInfo(category: Category): CategoryInfo | undefined {
  if (CATEGORIES[category]) return CATEGORIES[category];
  const custom = getCustomCategories().find((c) => c.id === category);
  if (!custom) return undefined;
  return { id: custom.id, icon: Tag, color: "text-slate-500", type: custom.type };
}

export const getCategoryIcon = (category: Category) => getCategoryInfo(category)?.icon || MoreHorizontal;
export const getCategoryColor = (category: Category) => getCategoryInfo(category)?.color || "text-slate-500";