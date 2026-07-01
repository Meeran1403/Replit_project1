import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 bg-background/50">
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:px-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
