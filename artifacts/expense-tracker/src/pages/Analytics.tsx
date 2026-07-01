import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { formatMonth, formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
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

export default function Analytics() {
  const { data } = useStore();

  // Generate last 6 months data for charts
  const monthlyData = useMemo(() => {
    const months = [];
    const date = new Date();
    date.setDate(1); // Set to 1st to avoid edge cases with varying month lengths
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date);
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().slice(0, 7);
      
      const monthTxs = data.transactions.filter(t => t.date.startsWith(monthStr));
      const income = monthTxs.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
      
      months.push({
        name: formatMonth(monthStr + "-01").split(" ")[0], // Just month name
        fullDate: monthStr,
        income,
        expense,
        net: income - expense
      });
    }
    return months;
  }, [data.transactions]);

  // Current month category pie
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const pieData = useMemo(() => {
    const currentMonthExpenses = data.transactions.filter(
      t => t.type === "expense" && t.date.startsWith(currentMonthStr)
    );
    
    const byCategory = currentMonthExpenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value,
        color: getHexColor(getCategoryColor(name as any)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.transactions, currentMonthStr]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
              <span className="font-medium text-foreground">{formatCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights into your spending habits.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-card shadow-sm border-none ring-1 ring-border col-span-full">
          <CardHeader>
            <CardTitle>Income vs Expenses (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader>
            <CardTitle>Net Balance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    name="Net Balance"
                    stroke="#14b8a6" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#14b8a6', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#14b8a6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-none ring-1 ring-border">
          <CardHeader>
            <CardTitle>Expenses by Category (This Month)</CardTitle>
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
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No expenses recorded this month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
