import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PlusCircle,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatCurrency } from "@/lib/formatters";
import { useStore } from "@/hooks/use-store";
import type { Category } from "@/hooks/use-store";
import { useSettings } from "@/hooks/use-settings";
import { TransactionRow } from "@/components/TransactionRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CATEGORIES, getCategoryColor } from "@/lib/categories";
import { cn } from "@/lib/utils";

const getHexColor = (colorClass: string) => {
  const map: Record<string, string> = {
    "text-orange-500": "#f97316", "text-blue-500": "#3b82f6",
    "text-indigo-500": "#6366f1", "text-purple-500": "#a855f7",
    "text-rose-500": "#f43f5e", "text-pink-500": "#ec4899",
    "text-amber-500": "#f59e0b", "text-sky-500": "#0ea5e9",
    "text-yellow-500": "#eab308", "text-emerald-500": "#10b981",
    "text-teal-500": "#14b8a6", "text-cyan-500": "#06b6d4",
    "text-slate-500": "#64748b",
  };
  return map[colorClass] || "#64748b";
};

const quickSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount"),
  type: z.enum(["expense", "income"]),
  category: z.string().min(1, "Pick a category"),
  note: z.string().optional(),
  date: z.string().min(1),
});
type QuickForm = z.infer<typeof quickSchema>;

export default function Dashboard() {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useStore();
  const { settings } = useSettings();
  const { toast } = useToast();
  const currency = settings.currency;
  const currencySymbol = settings.currencySymbol || "$";

  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<QuickForm>({
    resolver: zodResolver(quickSchema),
    defaultValues: { amount: 0, type: "expense", category: "", note: "", date: today },
  });

  const watchType = form.watch("type");
  const availableCategories = Object.values(CATEGORIES).filter(
    (c) => c.type === "both" || c.type === watchType
  );

  const handleQuickAdd = async (values: QuickForm) => {
    await addTransaction({
      amount: values.amount,
      type: values.type,
      category: values.category as Category,
      note: values.note ?? "",
      date: new Date(values.date).toISOString(),
    });
    toast({ title: values.type === "expense" ? "Expense added" : "Income added" });
    form.reset({ amount: 0, type: values.type, category: "", note: "", date: today });
  };

  const currentMonthTxs = data.transactions.filter((t) => t.date.startsWith(currentMonth));
  const allIncome = data.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpenses = data.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = (settings.startingBalance || 0) + allIncome - allExpenses;

  const monthlyIncome = currentMonthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = currentMonthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthlyNet = monthlyIncome - monthlyExpenses;

  const expenseByCategory = currentMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value, color: getHexColor(getCategoryColor(name as Category)) }))
    .sort((a, b) => b.value - a.value);

  const recentTransactions = data.transactions.slice(0, 5);
  const greeting = settings.name ? `Hi, ${settings.name.split(" ")[0]}` : "Dashboard";

  const handleUpdate = async (id: string, updateData: any) => {
    await updateTransaction(id, updateData);
    toast({ title: "Transaction updated" });
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    toast({ title: "Transaction deleted" });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">{greeting}</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Overall balance */}
      <Card className="bg-primary text-primary-foreground border-none shadow-lg">
        <CardContent className="p-6">
          <p className="text-primary-foreground/70 text-sm font-medium mb-1">Current Balance</p>
          <p className="text-4xl font-display font-bold">{formatCurrency(balance, currency)}</p>
          {settings.startingBalance > 0 && (
            <p className="text-primary-foreground/60 text-xs mt-2">
              Starting balance: {formatCurrency(settings.startingBalance, currency)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monthly summary */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              Income
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-display font-bold text-foreground">{formatCurrency(monthlyIncome, currency)}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">this month</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-display font-bold text-foreground">{formatCurrency(monthlyExpenses, currency)}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">this month</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              Net
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={cn("text-xl font-display font-bold", monthlyNet >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {monthlyNet >= 0 ? "+" : ""}{formatCurrency(monthlyNet, currency)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick add */}
      <Card className="bg-card shadow-sm border-none ring-1 ring-border">
        <CardHeader className="pb-3 pt-5 px-6">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-primary" />
            Quick add
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleQuickAdd)} className="space-y-3">
              {/* Type toggle */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="flex p-1 bg-muted rounded-lg w-full" data-testid="quick-type-toggle">
                    {(["expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { field.onChange(t); form.setValue("category", ""); }}
                        className={cn(
                          "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all capitalize",
                          field.value === t
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-7 h-9 text-sm"
                            {...field}
                            data-testid="quick-amount"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm" data-testid="quick-category">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <cat.icon className={cn("w-3.5 h-3.5", cat.color)} />
                                {cat.id}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Note */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormControl>
                        <Input
                          placeholder="Note (optional)"
                          className="h-9 text-sm"
                          {...field}
                          data-testid="quick-note"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormControl>
                        <Input type="date" className="h-9 text-sm" {...field} data-testid="quick-date" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-9" data-testid="quick-submit">
                Add entry
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recent + chart */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold">Recent</h2>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary text-sm h-8">
                View all
              </Button>
            </Link>
          </div>
          <div className="bg-card border rounded-2xl shadow-sm divide-y">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  currency={currency}
                />
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No transactions yet — use the quick add above.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-display font-semibold">This month</h2>
          <Card className="bg-card shadow-sm border-none ring-1 ring-border">
            <CardContent className="p-5">
              {pieData.length > 0 ? (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value">
                          {pieData.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value, currency)}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-3">
                    {pieData.slice(0, 4).map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground truncate max-w-[100px]">{entry.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{formatCurrency(entry.value, currency)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">No expenses this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
