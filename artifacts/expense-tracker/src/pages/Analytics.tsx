import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { useSettings } from "@/hooks/use-settings";
import { formatMonth, formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import { getCategoryColor } from "@/lib/categories";

const HEX_MAP: Record<string, string> = {
  "text-orange-500": "#f97316",
  "text-blue-500":   "#3b82f6",
  "text-indigo-500": "#6366f1",
  "text-purple-500": "#a855f7",
  "text-violet-500": "#8b5cf6",
  "text-rose-500":   "#f43f5e",
  "text-pink-500":   "#ec4899",
  "text-amber-500":  "#f59e0b",
  "text-sky-500":    "#0ea5e9",
  "text-yellow-500": "#eab308",
  "text-yellow-600": "#ca8a04",
  "text-emerald-500":"#10b981",
  "text-teal-500":   "#14b8a6",
  "text-cyan-500":   "#06b6d4",
  "text-cyan-600":   "#0891b2",
  "text-green-500":  "#22c55e",
  "text-lime-600":   "#65a30d",
  "text-slate-500":  "#64748b",
};
const getHexColor = (cls: string) => HEX_MAP[cls] ?? "#64748b";

export default function Analytics() {
  const { data } = useStore();
  const { settings } = useSettings();
  const currency = settings.currency;

  // ── Income vs Expenses (monthly, last 6 months) ───────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    now.setDate(1);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      const monthStr = d.toISOString().slice(0, 7);
      const txs = data.transactions.filter((t) => t.date.startsWith(monthStr));
      const income  = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return {
        name:     formatMonth(monthStr + "-01").split(" ")[0],
        fullDate: monthStr,
        income,
        expense,
        net: income - expense,
      };
    });
  }, [data.transactions]);

  // ── Net Balance Trend (cumulative running balance) ────────────────────────
  const balanceTrendData = useMemo(() => {
    const now = new Date();
    now.setDate(1);

    // Build ordered month strings for the last 6 months
    const monthStrs = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().slice(0, 7);
    });

    const firstMonth = monthStrs[0];

    // Start running balance from all transactions before our 6-month window
    let running = data.transactions
      .filter((t) => t.date.slice(0, 7) < firstMonth)
      .reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    return monthStrs.map((monthStr) => {
      const txs = data.transactions.filter((t) => t.date.startsWith(monthStr));
      const net  = txs.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);
      running += net;
      return {
        name:    formatMonth(monthStr + "-01").split(" ")[0],
        balance: running,
      };
    });
  }, [data.transactions]);

  // ── Pie: expenses by category (this month) ───────────────────────────────
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const pieData = useMemo(() => {
    const byCategory = data.transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(currentMonthStr))
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);

    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value, color: getHexColor(getCategoryColor(name as any)) }))
      .sort((a, b) => b.value - a.value);
  }, [data.transactions, currentMonthStr]);

  // ── Tooltips ─────────────────────────────────────────────────────────────
  const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-sm">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-medium text-foreground">{formatCurrency(Math.abs(p.value), currency)}</span>
          </div>
        ))}
      </div>
    );
  };

  const BalanceTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const val: number = payload[0]?.value ?? 0;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-sm">
        <p className="font-medium mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val >= 0 ? "#10b981" : "#f43f5e" }} />
          <span className="text-muted-foreground">Balance:</span>
          <span className={`font-semibold ${val >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {val >= 0 ? "+" : ""}{formatCurrency(val, currency)}
          </span>
        </div>
      </div>
    );
  };

  const yFmt = (v: number) => {
    const abs = Math.abs(v);
    const prefix = v < 0 ? "-" : "";
    if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(1)}k`;
    return `${prefix}${abs}`;
  };

  const hasAnyData   = data.transactions.length > 0;
  const hasBalance   = balanceTrendData.some((d) => d.balance !== 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights into your spending habits.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">

        {/* Income vs Expenses bar chart */}
        <Card className="bg-card shadow-sm border-none ring-1 ring-border col-span-full">
          <CardHeader>
            <CardTitle>Income vs Expenses — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {hasAnyData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={yFmt} />
                    <RechartsTooltip content={<BarTooltip />} />
                    <Legend iconType="circle" />
                    <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[4,4,0,0]} maxBarSize={40} />
                    <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4,4,0,0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState text="Add transactions to see your income vs expenses" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Net Balance Trend — cumulative running balance */}
        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader>
            <div>
              <CardTitle>Net Balance Trend</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Cumulative running balance over the last 6 months</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {hasBalance ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceTrendData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={yFmt} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                    <RechartsTooltip content={<BalanceTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      name="Balance"
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#14b8a6", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#14b8a6", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState text="Add transactions to see your balance trend" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expenses by category pie */}
        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader>
            <CardTitle>Expenses by Category — This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value, currency)}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState text="No expenses recorded this month" />
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}
