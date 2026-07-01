import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Transaction } from "@/hooks/use-store";
import { CategoryIcon } from "./CategoryIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TransactionForm } from "./TransactionForm";

interface TransactionRowProps {
  transaction: Transaction;
  onUpdate: (id: string, data: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

export function TransactionRow({ transaction, onUpdate, onDelete, currency = "USD" }: TransactionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isIncome = transaction.type === "income";
  const displayNote = transaction.note || (transaction as any).description || "";

  return (
    <>
      <div
        className="group flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
        data-testid={`transaction-row-${transaction.id}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <CategoryIcon category={transaction.category} />
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {displayNote || transaction.category}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{transaction.category}</span>
              <span>·</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`font-semibold tabular-nums ${isIncome ? "text-emerald-500 dark:text-emerald-400" : "text-foreground"}`}>
            {isIncome ? "+" : "−"}{formatCurrency(transaction.amount, currency)}
          </span>

          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
              data-testid={`button-edit-${transaction.id}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setIsDeleting(true)}
              data-testid={`button-delete-${transaction.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            defaultValues={transaction}
            onSubmit={(data) => { onUpdate(transaction.id, data); setIsEditing(false); }}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(transaction.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid={`button-confirm-delete-${transaction.id}`}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
