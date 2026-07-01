import { useLocation } from "wouter";
import { useStore } from "@/hooks/use-store";
import { TransactionForm } from "@/components/TransactionForm";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AddTransaction() {
  const { addTransaction } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (data: any) => {
    addTransaction(data);
    toast({
      title: "Transaction added",
      description: "Your transaction has been successfully saved.",
    });
    setLocation("/transactions");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Add Transaction</h1>
        <p className="text-muted-foreground mt-1">Record a new income or expense.</p>
      </div>

      <Card className="bg-card shadow-sm border-none ring-1 ring-border">
        <CardContent className="p-6 md:p-8">
          <TransactionForm 
            onSubmit={handleSubmit}
            submitLabel="Add Transaction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
