import { Trash2, Edit2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { Budget } from "@/hooks/use-store";
import { CategoryIcon } from "./CategoryIcon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  onEdit: () => void;
  onDelete: () => void;
  currency?: string;
}

export function BudgetCard({ budget, spent, onEdit, onDelete, currency = "USD" }: BudgetCardProps) {
  const percentage = Math.min(Math.round((spent / budget.limit) * 100), 100);
  const isOverBudget = spent >= budget.limit;
  const isNearBudget = percentage >= 80 && !isOverBudget;

  const progressColor = isOverBudget
    ? "bg-destructive"
    : isNearBudget
    ? "bg-amber-500"
    : "bg-primary";

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md" data-testid={`budget-card-${budget.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <CategoryIcon category={budget.category} />
          <div>
            <h3 className="font-semibold text-foreground">{budget.category}</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(spent, currency)} of {formatCurrency(budget.limit, currency)}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onEdit} data-testid={`button-edit-budget-${budget.id}`}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete} data-testid={`button-delete-budget-${budget.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            {percentage}% spent
          </span>
          <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            {isOverBudget
              ? `${formatCurrency(spent - budget.limit, currency)} over budget`
              : `${formatCurrency(budget.limit - spent, currency)} remaining`}
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-2.5"
          indicatorClassName={progressColor}
        />
      </div>
    </div>
  );
}
