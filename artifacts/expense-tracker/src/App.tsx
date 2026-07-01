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
  const [onboardingDone, setOnboardingDone] = useState(settings.onboardingComplete);

  if (!onboardingDone) {
    return (
      <TooltipProvider>
        <Onboarding onComplete={() => setOnboardingDone(true)} />
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
