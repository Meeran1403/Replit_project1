import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Wallet, PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useStore } from "@/hooks/use-store";
import { useSettings } from "@/hooks/use-settings";
import { TransactionRow } from "@/components/TransactionRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getCategoryColor } from "@/lib/categories";

const getHexColor = (colorClass: string) => {
  const map: Record<string, string> = {
    "text-orange-500": "#f97316",
    "text-blue-500": "#3b82f6",
    "text-indigo-500": "#6366f1",
    "text-purple-500": "#a855f7",
    "text-rose-500": "#f43f5e",
    "text-pink-500": "#ec4899",
    "text-amber-500": "#f59e0b",
    "text-sky-500": "#0ea5e9",
    "text-yellow-500": "#eab308",
    "text-emerald-500": "#10b981",
    "text-teal-500": "#14b8a6",
    "text-cyan-500": "#06b6d4",
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

  const currentMonthTransactions = data.transactions.filter(
    (t) => t.date.startsWith(currentMonth)
  );

  const income = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = income - expenses;

  const expenseByCategory = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({
      name,
      value,
      color: getHexColor(getCategoryColor(name as any)),
    }))
    .sort((a, b) => b.value - a.value);

  const recentTransactions = data.transactions.slice(0, 5);

  const handleUpdate = (id: string, updateData: any) => {
    updateTransaction(id, updateData);
    toast({ title: "Transaction updated" });
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({ title: "Transaction deleted" });
  };

  const greeting = settings.name ? `Hi, ${settings.name.split(" ")[0]}` : "Dashboard";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">{greeting}</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your finances for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">
              {formatCurrency(netBalance, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">
              {formatCurrency(income, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">
              {formatCurrency(expenses, currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold">Recent Transactions</h2>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
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
                <p>No transactions yet.</p>
                <Link href="/add">
                  <Button variant="link" className="mt-2 text-primary">Add your first transaction</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold">Top Expenses</h2>
          </div>
          <Card className="bg-card shadow-sm border-none ring-1 ring-border">
            <CardContent className="p-6">
              {pieData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value, currency)}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
                  <PieChartIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p>No expenses this month</p>
                </div>
              )}

              <div className="space-y-3 mt-4">
                {pieData.slice(0, 3).map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-foreground">{entry.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{formatCurrency(entry.value, currency)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
