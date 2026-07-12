import { ImportFromSheetDialog } from "@/components/ImportFromSheetDialog";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ListOrdered, PlusCircle, PieChart, Target, Moon, Sun, Settings } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useSettings } from "@/hooks/use-settings";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ListOrdered },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();

  const initials = settings.name
    ? settings.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-sidebar border-sidebar-border shadow-sm z-10 sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">L</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Ledger</h1>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                }`}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 space-y-1 border-t border-sidebar-border">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            data-testid="button-toggle-theme"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>
          <ImportFromSheetDialog />

          {settings.name && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs font-bold">{initials}</span>
              </div>
              <span className="text-sm text-foreground font-medium truncate">{settings.name}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50 px-2 py-2 pb-safe flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`mobile-nav-link-${item.label.toLowerCase()}`}
            >
              <div className={`p-1.5 rounded-full mb-1 transition-colors ${isActive ? "bg-primary/10" : "bg-transparent"}`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              </div>
              <span className={`text-[10px] ${isActive ? "font-semibold text-primary" : "font-medium"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
