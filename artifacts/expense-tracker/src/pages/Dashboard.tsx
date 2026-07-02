import { Link } from "wouter";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart as PieChartIcon,
  PlusCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useStore } from "@/hooks/use-store";
import { useSettings } from "@/hooks/use-settings";
import { TransactionRow } from "@/components/TransactionRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getCategoryColor } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/hooks/use-store";

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

export default function Dashboard() {
  const { data, updateTransaction, deleteTransaction } = useStore();
  const { settings } = useSettings();
  const { toast } = useToast();
  const currency = settings.currency;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const currentMonthTxs = data.transactions.filter((t) => t.date.startsWith(currentMonth));
  const allIncome = data.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpenses = data.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = allIncome - allExpenses;

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

  if (data.transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">{greeting}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">No transactions yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-8">
            Add your first income or expense to see your balance and spending summary here.
          </p>
          <Link href="/add">
            <Button size="lg" className="gap-2">
              <PlusCircle className="w-5 h-5" />
              Add first transaction
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
                <p className="text-sm">No transactions yet — add one from the Transactions page.</p>
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
