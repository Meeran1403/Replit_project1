import { useState, useEffect } from "react";
import { useSettings, CURRENCIES } from "@/hooks/use-settings";
import { useStore, resetStore } from "@/hooks/use-store";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, Download, AlertTriangle, Moon, Sun, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { ImportFromSheetDialog } from "@/components/ImportFromSheetDialog";
import {
  getAllCategories,
  getCustomCategories,
  addCustomCategory,
  removeCustomCategory,
  subscribeCategories,
  type CategoryInfo,
} from "@/lib/categories";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { data } = useStore();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(settings.name || "");
  const [currency, setCurrency] = useState(settings.currency || "USD");
  const [currencySearch, setCurrencySearch] = useState("");
  const [showReset, setShowReset] = useState(false);

  const [categories, setCategories] = useState<CategoryInfo[]>(getAllCategories());
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"expense" | "income">("expense");
  const customIds = new Set(getCustomCategories().map((c) => c.id));

  useEffect(() => subscribeCategories(() => setCategories(getAllCategories())), []);

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.includes(currencySearch)
  );

  const handleSave = () => {
    updateSettings({
      name: name.trim(),
      currency: selectedCurrency.code,
      currencySymbol: selectedCurrency.symbol,
    });
    toast({ title: "Settings saved" });
  };

  const handleAddCategory = () => {
    const ok = addCustomCategory(newCategory, newCategoryType);
    if (ok) {
      toast({ title: "Category added", description: `"${newCategory.trim()}" is now available when adding transactions.` });
      setNewCategory("");
    } else {
      toast({ title: "Couldn't add category", description: "That name is empty or already exists.", variant: "destructive" as any });
    }
  };

  const handleRemoveCategory = (id: string) => {
    removeCustomCategory(id);
    toast({ title: "Category removed" });
  };

  const doExport = () => {
    if (data.transactions.length === 0) return false;
    const header = ["Date", "Type", "Category", "Note", "Amount", "Currency"];
    const rows = data.transactions.map((t) => [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.type,
      t.category,
      `"${(t.note || "").replace(/"/g, '""')}"`,
      t.type === "expense" ? `-${t.amount}` : `${t.amount}`,
      settings.currency || "USD",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  };

  const handleExportAndDelete = () => {
    doExport();
    resetStore();
    setShowReset(false);
    toast({ title: "Exported and cleared", description: "Your data was exported then deleted." });
  };

  const handleDeleteOnly = () => {
    resetStore();
    setShowReset(false);
    toast({ title: "All data cleared", description: "Your transactions and budgets have been deleted." });
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Update your preferences anytime.</p>
      </div>

      {/* Profile */}
      <Card className="bg-card shadow-sm border-none ring-1 ring-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Your name</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 bg-background"
            data-testid="input-settings-name"
          />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="bg-card shadow-sm border-none ring-1 ring-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark themes.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2 shrink-0"
              data-testid="button-toggle-theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === "light" ? "Dark" : "Light"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="bg-card shadow-sm border-none ring-1 ring-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Currency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search currencies…"
            value={currencySearch}
            onChange={(e) => setCurrencySearch(e.target.value)}
            className="h-10 bg-background"
          />
          <div className="h-56 overflow-y-auto space-y-1 pr-1">
            {filteredCurrencies.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all",
                  currency === c.code
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <span>{c.name}</span>
                <span className={cn("font-mono text-base", currency === c.code ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {c.symbol} {c.code}
                </span>
              </button>
            ))}
            {filteredCurrencies.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No currencies found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} size=" **…**

_This response is too long to display in full._