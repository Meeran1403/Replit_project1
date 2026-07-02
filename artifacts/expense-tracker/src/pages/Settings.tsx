import { useState } from "react";
import { useSettings, CURRENCIES } from "@/hooks/use-settings";
import { useStore, resetStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
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

  const handleReset = () => {
    resetStore();
    toast({ title: "All data cleared", description: "Your transactions and budgets have been deleted." });
    setShowReset(false);
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

      <AlertDialog open={showReset} onOpenChange={setShowReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your transactions and budgets. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, clear everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
