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
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/hooks/use-store";

export interface CategoryInfo {
  id: Category;
  icon: LucideIcon;
  color: string;
  type: "income" | "expense" | "both";
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
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

export const getCategoryIcon  = (category: Category) => CATEGORIES[category]?.icon  || MoreHorizontal;
export const getCategoryColor = (category: Category) => CATEGORIES[category]?.color || "text-slate-500";
