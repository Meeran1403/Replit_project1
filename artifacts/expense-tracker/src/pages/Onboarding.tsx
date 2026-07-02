import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Wallet,
  User,
  Globe,
  HardDrive,
  FolderOpen,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings, CURRENCIES } from "@/hooks/use-settings";
import type { UserSettings } from "@/hooks/use-settings";
import { supportsFileSystem, initFileStorage, resetStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { completeOnboarding } = useSettings();
  const hasFS = supportsFileSystem();

  const totalSteps = hasFS ? 3 : 2;

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [currencySearch, setCurrencySearch] = useState("");
  const [storageChoice, setStorageChoice] = useState<"localStorage" | "filesystem">("localStorage");
  const [isPickingFile, setIsPickingFile] = useState(false);

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.includes(currencySearch)
  );

  const STEPS = [
    { id: 1, label: "Name", icon: User },
    { id: 2, label: "Currency", icon: Globe },
    ...(hasFS ? [{ id: 3, label: "Storage", icon: HardDrive }] : []),
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setNameError("Please enter your name to continue.");
        return;
      }
      setNameError("");
    }
    if (step < totalSteps) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    let finalStorage: "localStorage" | "filesystem" = storageChoice;

    resetStore();

    if (hasFS && storageChoice === "filesystem") {
      setIsPickingFile(true);
      const ok = await initFileStorage();
      setIsPickingFile(false);
      if (!ok) {
        finalStorage = "localStorage";
      }
    }

    const data: Omit<UserSettings, "onboardingComplete"> = {
      name: name.trim(),
      currency: selectedCurrency.code,
      currencySymbol: selectedCurrency.symbol,
      startingBalance: 0,
      storageType: finalStorage,
    };
    completeOnboarding(data);
    onComplete();
  };

  const isLastStep = step === totalSteps;

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
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                      isComplete
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/15 text-primary ring-2 ring-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn("text-[11px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
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
          {/* Step 1 – Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Welcome to Ledger</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Your personal finance tracker — everything stays on your device. No account needed.
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
                  className="h-11 text-base"
                  autoFocus
                  data-testid="input-onboarding-name"
                />
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              </div>
            </div>
          )}

          {/* Step 2 – Currency */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Your currency</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  All amounts will be shown in your chosen currency.
                </p>
              </div>
              <Input
                placeholder="Search currencies..."
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                className="h-10"
                data-testid="input-currency-search"
              />
              <div className="h-64 overflow-y-auto space-y-1 pr-1">
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

          {/* Step 3 – Storage (only if File System API available) */}
          {step === 3 && hasFS && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Where to save your data</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Your data never leaves your device. Choose where you want it stored.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStorageChoice("localStorage")}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                    storageChoice === "localStorage"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                  data-testid="option-storage-local"
                >
                  <div className={cn("mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    storageChoice === "localStorage" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={cn("font-semibold", storageChoice === "localStorage" ? "text-primary" : "text-foreground")}>
                      Browser storage
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Data is saved automatically in this browser. Easiest option, works offline.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStorageChoice("filesystem")}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                    storageChoice === "filesystem"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                  data-testid="option-storage-file"
                >
                  <div className={cn("mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    storageChoice === "filesystem" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={cn("font-semibold", storageChoice === "filesystem" ? "text-primary" : "text-foreground")}>
                      File on your computer
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Save as a <code className="text-xs bg-muted px-1 rounded">.json</code> file you control. Back it up, move it, share it.
                    </p>
                  </div>
                </button>
              </div>
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
            {step} of {totalSteps}
          </span>

          {!isLastStep ? (
            <Button onClick={handleNext} className="gap-2" data-testid="button-onboarding-next">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isPickingFile}
              className="gap-2"
              data-testid="button-onboarding-finish"
            >
              {isPickingFile ? "Choosing file…" : "Get started"}
              {!isPickingFile && <CheckCircle2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
