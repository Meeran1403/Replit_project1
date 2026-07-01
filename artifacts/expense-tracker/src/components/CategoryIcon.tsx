import { getCategoryIcon, getCategoryColor } from "@/lib/categories";
import type { Category } from "@/hooks/use-store";

export function CategoryIcon({ category, className = "" }: { category: Category; className?: string }) {
  const Icon = getCategoryIcon(category);
  const colorClass = getCategoryColor(category);

  return (
    <div className={`flex items-center justify-center p-2 rounded-xl bg-muted/50 ${colorClass} ${className}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
}
