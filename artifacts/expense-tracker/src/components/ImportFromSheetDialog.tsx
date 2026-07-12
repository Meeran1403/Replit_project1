import { useState } from "react";
import { CloudDownload } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { importFromSheet, sheetDataToTransactions } from "@/lib/sheetSync";

export function ImportFromSheetDialog() {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const { bulkAddTransactions } = useStore();
  const { toast } = useToast();

  async function handleImport() {
    setLoading(true);
    try {
      const data = await importFromSheet(year, month || undefined);
      const transactions = sheetDataToTransactions(data);
      if (transactions.length === 0) {
        toast({ title: "Nothing to import", description: "No transactions found for that sheet." });
      } else {
        await bulkAddTransactions(transactions as any);
        toast({ title: "Import complete", description: `Added ${transactions.length} transactions.` });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" as any });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" data-testid="button-import-sheet">
          <CloudDownload className="w-4 h-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Google Sheet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="year">Year (spreadsheet name)</Label>
            <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2027" />
          </div>
          <div>
            <Label htmlFor="month">Month tab (optional — leave blank to import the whole year)</Label>
            <Input id="month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="JAN" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={loading}>
            {loading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}