import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import Budgets from "./pages/Budgets";
import Analytics from "./pages/Analytics";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/not-found";
import { useSettings } from "./hooks/use-settings";
import { useStore } from "./hooks/use-store";
import { RefreshCw, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">Loading your data…</p>
      </div>
    </div>
  );
}

function ReconnectScreen({ onReconnect }: { onReconnect: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onReconnect();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-card border rounded-2xl shadow-sm p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <FolderOpen className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Reconnect to your file</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Your data is saved in a file on your computer. Tap below to grant access and continue.
          </p>
        </div>
        <Button onClick={handleClick} disabled={loading} className="w-full gap-2">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
          {loading ? "Connecting…" : "Open my data file"}
        </Button>
      </div>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/add" component={AddTransaction} />
        <Route path="/budgets" component={Budgets} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  const { settings } = useSettings();
  const { isLoading, needsReconnect, reconnect } = useStore();
  const [onboardingDone, setOnboardingDone] = useState(settings.onboardingComplete);

  if (!onboardingDone) {
    return (
      <TooltipProvider>
        <Onboarding onComplete={() => setOnboardingDone(true)} />
        <Toaster />
      </TooltipProvider>
    );
  }

  if (isLoading) {
    return (
      <TooltipProvider>
        <LoadingScreen />
        <Toaster />
      </TooltipProvider>
    );
  }

  if (needsReconnect) {
    return (
      <TooltipProvider>
        <ReconnectScreen onReconnect={reconnect} />
        <Toaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
