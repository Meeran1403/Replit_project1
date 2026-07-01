import { useState } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft, Wallet, User, Globe, Target, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings, CURRENCIES, ALL_CATEGORIES } from "@/hooks/use-settings";
import type { UserSettings } from "@/hooks/use-settings";
import type { Category } from "@/hooks/use-store";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Name", icon: User },
  { id: 2, label: "Currency", icon: Globe },
  { id: 3, label: "Budget", icon: Target },
  { id: 4, label: "Categories", icon: LayoutGrid },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { completeOnboarding } = useSettings();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [currencySearch, setCurrencySearch] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [enabledCategories, setEnabledCategories] = useState<Category[]>([...ALL_CATEGORIES]);

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.includes(currencySearch)
  );

  const toggleCategory = (cat: Category) => {
    setEnabledCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setNameError("Please enter your name to continue.");
        return;
      }
      setNameError("");
    }
    if (step < STEPS.length) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = () => {
    const data: Omit<UserSettings, "onboardingComplete"> = {
      name: name.trim(),
      currency: selectedCurrency.code,
      currencySymbol: selectedCurrency.symbol,
      monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : 0,
      enabledCategories: enabledCategories.length > 0 ? enabledCategories : [...ALL_CATEGORIES],
    };
    completeOnboarding(data);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Ledger</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10 gap-0">
          {STEPS.map((s, i) => {
            const isComplete = step > s.id;
            const isActive = step === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                      isComplete
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/15 text-primary ring-2 ring-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-12 mx-1 mb-5 transition-all duration-300",
                      step > s.id ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-card border rounded-2xl shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Welcome to Ledger</h2>
                <p className="text-muted-foreground mt-2">
                  Your personal finance tracker — all data stays on your device, no account needed.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="name-input">
                  What should we call you?
                </label>
                <Input
                  id="name-input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  className="text-base h-11"
                  autoFocus
                  data-testid="input-onboarding-name"
                />
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Your currency</h2>
                <p className="text-muted-foreground mt-1">
                  All amounts will be displayed in your chosen currency.
                </p>
              </div>
              <Input
                placeholder="Search currencies..."
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                className="h-10"
                data-testid="input-currency-search"
              />
              <div className="h-64 overflow-y-auto space-y-1 pr-1 -mr-1">
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
                    data-testid={`option-currency-${c.code}`}
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Monthly budget</h2>
                <p className="text-muted-foreground mt-1">
                  Set an overall spending limit for each month. You can always change this later.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Total monthly spending limit ({selectedCurrency.code})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    {selectedCurrency.symbol}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 2000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="pl-9 h-11 text-base"
                    data-testid="input-monthly-budget"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional — leave blank to skip budget tracking for now.
                </p>
              </div>

              {monthlyBudget && parseFloat(monthlyBudget) > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-primary font-medium">
                    Your monthly limit: {selectedCurrency.symbol}{parseFloat(monthlyBudget).toLocaleString()} {selectedCurrency.code}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The app will alert you as you approach this limit.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Your categories</h2>
                <p className="text-muted-foreground mt-1">
                  Choose which spending and income categories matter to you.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const info = CATEGORIES[cat];
                  const isEnabled = enabledCategories.includes(cat);
                  const Icon = info.icon;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all duration-150",
                        isEnabled
                          ? "border-primary/30 bg-primary/5 text-foreground font-medium"
                          : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/40"
                      )}
                      data-testid={`toggle-category-${cat}`}
                    >
                      <Icon className={cn("w-4 h-4 flex-shrink-0", isEnabled ? info.color : "text-muted-foreground/50")} />
                      <span className="truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {enabledCategories.length} of {ALL_CATEGORIES.length} selected
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
            data-testid="button-onboarding-back"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <span className="text-sm text-muted-foreground">
            {step} of {STEPS.length}
          </span>

          {step < STEPS.length ? (
            <Button onClick={handleNext} className="gap-2" data-testid="button-onboarding-next">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="gap-2 bg-primary hover:bg-primary/90"
              data-testid="button-onboarding-finish"
            >
              Get started
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
