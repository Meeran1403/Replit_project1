import { useState, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useSettings } from "@/hooks/use-settings";
import { TransactionRow } from "@/components/TransactionRow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";

export default function Transactions() {
  const { data, updateTransaction, deleteTransaction } = useStore();
  const { settings } = useSettings();
  const { toast } = useToast();
  const currency = settings.currency;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredTransactions = useMemo(() => {
    return data.transactions
      .filter((t) => {
        const note = t.note || (t as any).description || "";
        const matchesSearch =
          note.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "all" || t.type === typeFilter;
        const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [data.transactions, search, typeFilter, categoryFilter, sortOrder]);

  const handleUpdate = async (id: string, updateData: any) => {
    await updateTransaction(id, updateData);
    toast({ title: "Transaction updated" });
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    toast({ title: "Transaction deleted" });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Transactions</h1>

      <div className="bg-card p-4 rounded-2xl shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by note or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px] bg-background" data-testid="select-filter-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] bg-background" data-testid="select-filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.keys(CATEGORIES).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
              title={`Currently: ${sortOrder === "newest" ? "Newest first" : "Oldest first"}`}
              className="bg-background shrink-0"
              data-testid="button-sort"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm divide-y">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              currency={currency}
            />
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              {data.transactions.length === 0 ? "No transactions yet" : "No results"}
            </p>
            <p className="text-sm">
              {data.transactions.length === 0
                ? "Add your first entry from the dashboard."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
