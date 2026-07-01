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
}

export function TransactionRow({ transaction, onUpdate, onDelete }: TransactionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isIncome = transaction.type === "income";

  return (
    <>
      <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border" data-testid={`transaction-row-${transaction.id}`}>
        <div className="flex items-center gap-4">
          <CategoryIcon category={transaction.category} />
          <div>
            <p className="font-medium text-foreground">{transaction.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{transaction.category}</span>
              <span>•</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`font-semibold ${isIncome ? "text-emerald-500 dark:text-emerald-400" : "text-foreground"}`}>
            {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
          </span>
          
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 md:gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)} data-testid={`button-edit-${transaction.id}`}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setIsDeleting(true)} data-testid={`button-delete-${transaction.id}`}>
              <Trash2 className="w-4 h-4" />
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
            onSubmit={(data) => {
              onUpdate(transaction.id, data);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(transaction.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid={`button-confirm-delete-${transaction.id}`}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
