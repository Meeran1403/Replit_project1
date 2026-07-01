import { useState, useMemo } from "react";
import { PlusCircle, Target } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { BudgetCard } from "@/components/BudgetCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatMonth } from "@/lib/formatters";

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  limit: z.coerce.number().positive("Limit must be greater than 0"),
});

export default function Budgets() {
  const { data, setBudget, deleteBudget } = useStore();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const form = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: "",
      limit: 0,
    },
  });

  const monthBudgets = useMemo(() => {
    return data.budgets.filter((b) => b.month === selectedMonth);
  }, [data.budgets, selectedMonth]);

  const monthExpenses = useMemo(() => {
    const expenses = data.transactions.filter(
      (t) => t.type === "expense" && t.date.startsWith(selectedMonth)
    );
    
    return expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [data.transactions, selectedMonth]);

  const handleSubmit = (values: z.infer<typeof budgetSchema>) => {
    setBudget({
      category: values.category as any,
      limit: values.limit,
      month: selectedMonth,
    });
    
    toast({ title: editingBudget ? "Budget updated" : "Budget added" });
    setIsAdding(false);
    setEditingBudget(null);
    form.reset();
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    form.reset({
      category: budget.category,
      limit: budget.limit,
    });
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    deleteBudget(id);
    toast({ title: "Budget deleted" });
  };

  // Generate last 6 months for selector
  const monthOptions = useMemo(() => {
    const opts = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      opts.push(date.toISOString().slice(0, 7));
      date.setMonth(date.getMonth() - 1);
    }
    return opts;
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Set limits and track your spending.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(m => (
                <SelectItem key={m} value={m}>{formatMonth(m + "-01")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={() => {
            setEditingBudget(null);
            form.reset({ category: "", limit: 0 });
            setIsAdding(true);
          }} data-testid="button-add-budget">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Budget
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {monthBudgets.length > 0 ? (
          monthBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              spent={monthExpenses[budget.category] || 0}
              onEdit={() => handleEdit(budget)}
              onDelete={() => handleDelete(budget.id)}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-card border border-dashed rounded-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No budgets set for this month</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Create a budget to help you stay on track with your spending goals.
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create your first budget
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isAdding} onOpenChange={(open) => {
        setIsAdding(open);
        if (!open) {
          setEditingBudget(null);
          form.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "Create Budget"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingBudget}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(CATEGORIES)
                          .filter(c => c.type !== "income")
                          .map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Limit</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input type="number" step="0.01" className="pl-7" placeholder="0.00" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit">Save Budget</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
