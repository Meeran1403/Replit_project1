import { useState, useMemo } from "react";
import { Search, Filter, Calendar as CalendarIcon, ArrowUpDown } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { TransactionRow } from "@/components/TransactionRow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";

export default function Transactions() {
  const { data, updateTransaction, deleteTransaction } = useStore();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredTransactions = useMemo(() => {
    return data.transactions
      .filter((t) => {
        const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
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

  const handleUpdate = (id: string, updateData: any) => {
    updateTransaction(id, updateData);
    toast({ title: "Transaction updated" });
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({ title: "Transaction deleted" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Transactions</h1>
      </div>

      <div className="bg-card p-4 rounded-2xl shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] bg-background" data-testid="select-filter-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] bg-background" data-testid="select-filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(CATEGORIES).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
              title={`Sort by date: ${sortOrder === "newest" ? "Oldest first" : "Newest first"}`}
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
            />
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">No transactions found</p>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
