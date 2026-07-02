import { useState } from "react";
import { useSettings, CURRENCIES } from "@/hooks/use-settings";
import { useStore, resetStore } from "@/hooks/use-store";
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
import { Trash2, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { data } = useStore();
  const { toast } = useToast();

  const [name, setName] = useState(settings.name || "");
  const [currency, setCurrency] = useState(settings.currency || "USD");
  const [currencySearch, setCurrencySearch] = useState("");
  const [showReset, setShowReset] = useState(false);

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

  const handleExportOnly = () => {
    const exported = doExport();
    if (!exported) {
      toast({ title: "Nothing to export", description: "Add some transactions first." });
    } else {
      toast({ title: "Exported", description: `${data.transactions.length} transactions saved as CSV.` });
    }
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

      <Button onClick={handleSave} size="lg" className="w-full" data-testid="button-save-settings">
        Save changes
      </Button>

      {/* Export */}
      <Card className="bg-card shadow-sm border-none ring-1 ring-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Export data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Download as CSV</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.transactions.length > 0
                  ? `${data.transactions.length} transaction${data.transactions.length === 1 ? "" : "s"} ready to export`
                  : "No transactions yet"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportOnly}
              className="gap-2 shrink-0"
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="bg-card shadow-sm border-none ring-1 ring-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Clear all data</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently delete all transactions and budgets.</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowReset(true)}
              className="gap-2 shrink-0"
              data-testid="button-clear-data"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear All Data — 3-option dialog */}
      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle className="text-lg">Clear all data?</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              This will permanently delete all your transactions and budgets. Would you like to export a backup before continuing?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full gap-2 justify-start h-11"
              onClick={handleExportAndDelete}
              data-testid="button-export-and-delete"
            >
              <Download className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Export &amp; Delete</p>
                <p className="text-xs text-muted-foreground font-normal">Download CSV backup, then clear everything</p>
              </div>
            </Button>

            <Button
              variant="destructive"
              className="w-full gap-2 justify-start h-11"
              onClick={handleDeleteOnly}
              data-testid="button-delete-without-export"
            >
              <Trash2 className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium text-sm">Delete Without Export</p>
                <p className="text-xs text-destructive-foreground/70 font-normal">Permanently remove all data immediately</p>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowReset(false)}
              data-testid="button-cancel-reset"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
