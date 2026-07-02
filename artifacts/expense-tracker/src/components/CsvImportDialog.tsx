import { useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useStore } from "@/hooks/use-store";
import type { Category, TransactionType } from "@/hooks/use-store";
import { CATEGORIES } from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ── CSV parser (handles quoted fields with escaped quotes) ────────────────────
function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cell += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === "," && !inQuote) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map(parseCsvRow);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ParsedRow {
  date: string;
  type: TransactionType;
  category: Category;
  note: string;
  amount: number;
}

interface SkippedRow {
  rowNum: number;
  raw: string;
  reason: string;
}

interface ParseResult {
  valid: ParsedRow[];
  skipped: SkippedRow[];
}

// ── Validation ────────────────────────────────────────────────────────────────
const KNOWN_CATEGORIES = new Set(Object.keys(CATEGORIES));
const CATEGORY_ALIASES: Record<string, Category> = {
  "food":          "Food & Dining",
  "food and dining": "Food & Dining",
  "transport":     "Transportation",
  "health":        "Healthcare",
  "medical":       "Healthcare",
  "bills":         "Utilities",
  "rent":          "Housing",
  "home":          "Housing",
  "movie":         "Movies",
  "grocery":       "Groceries",
  "snack":         "Junk Food",
  "mobile":        "Recharge",
  "saving":        "Savings",
  "wage":          "Salary",
  "business":      "Freelance",
  "invest":        "Investment",
};

function normalizeCategory(raw: string): Category {
  const trimmed = raw.trim();
  if (KNOWN_CATEGORIES.has(trimmed)) return trimmed as Category;
  const lower = trimmed.toLowerCase();
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    if (lower.includes(alias)) return cat;
  }
  return "Other";
}

function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  // Accept YYYY-MM-DD directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return s;
  }
  // Try parsing other formats
  const d = new Date(s);
  if (!isNaN(d.getTime())) return format(d, "yyyy-MM-dd");
  return null;
}

function parseRows(rows: string[][], headerRow: string[]): ParseResult {
  const header = headerRow.map((h) => h.toLowerCase().trim());
  const idx = {
    date:     header.findIndex((h) => h.includes("date")),
    type:     header.findIndex((h) => h === "type" || h.includes("type")),
    category: header.findIndex((h) => h.includes("categ")),
    note:     header.findIndex((h) => h.includes("note") || h.includes("desc")),
    amount:   header.findIndex((h) => h.includes("amount") || h.includes("amt")),
  };

  const valid: ParsedRow[] = [];
  const skipped: SkippedRow[] = [];

  rows.forEach((cells, i) => {
    const rowNum = i + 2; // +2 because header is row 1
    const get = (key: keyof typeof idx) => {
      const j = idx[key];
      return j >= 0 && j < cells.length ? cells[j].trim() : "";
    };

    // --- Date ---
    const rawDate = get("date");
    const date = normalizeDate(rawDate);
    if (!date) {
      skipped.push({ rowNum, raw: cells.join(","), reason: `Invalid or missing date: "${rawDate}"` });
      return;
    }

    // --- Amount ---
    const rawAmount = get("amount");
    const amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, ""));
    if (isNaN(amount) || amount === 0) {
      skipped.push({ rowNum, raw: cells.join(","), reason: `Invalid or zero amount: "${rawAmount}"` });
      return;
    }

    // --- Type (infer from amount sign if column missing) ---
    let type: TransactionType;
    const rawType = get("type").toLowerCase();
    if (rawType === "income" || rawType === "credit" || rawType === "in") {
      type = "income";
    } else if (rawType === "expense" || rawType === "debit" || rawType === "out") {
      type = "expense";
    } else if (idx.type < 0 || rawType === "") {
      // Infer from sign
      type = amount >= 0 ? "income" : "expense";
    } else {
      skipped.push({ rowNum, raw: cells.join(","), reason: `Unrecognised type: "${get("type")}"` });
      return;
    }

    const category = normalizeCategory(get("category") || "Other");
    const note = get("note");

    valid.push({ date, type, category, note, amount: Math.abs(amount) });
  });

  return { valid, skipped };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface CsvImportDialogProps {
  onImported?: (count: number) => void;
}

export function CsvImportDialog({ onImported }: CsvImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { bulkAddTransactions } = useStore();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length < 2) {
        toast({ title: "Empty or unreadable CSV", description: "The file has no data rows.", variant: "destructive" });
        return;
      }
      const [header, ...dataRows] = rows;
      const parsed = parseRows(dataRows, header);
      setResult(parsed);
      setOpen(true);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!result || result.valid.length === 0) return;
    setImporting(true);
    await bulkAddTransactions(result.valid);
    setImporting(false);
    setOpen(false);
    onImported?.(result.valid.length);
    toast({
      title: `Imported ${result.valid.length} transaction${result.valid.length === 1 ? "" : "s"}`,
      description: result.skipped.length > 0
        ? `${result.skipped.length} row${result.skipped.length === 1 ? "" : "s"} were skipped.`
        : "All rows were imported successfully.",
    });
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Button
        variant="outline"
        size="sm"
        className="gap-2 shrink-0"
        onClick={() => fileRef.current?.click()}
        data-testid="button-import-csv"
      >
        <Upload className="w-4 h-4" />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Import Preview
            </DialogTitle>
            <DialogDescription>
              Review the transactions parsed from <span className="font-medium text-foreground">{fileName}</span> before importing.
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">

              {/* Summary badges */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {result.valid.length} ready to import
                </div>
                {result.skipped.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {result.skipped.length} will be skipped
                  </div>
                )}
              </div>

              {/* Valid transactions table */}
              {result.valid.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                          <th className="px-3 py-2 text-left font-medium">Date</th>
                          <th className="px-3 py-2 text-left font-medium">Type</th>
                          <th className="px-3 py-2 text-left font-medium">Category</th>
                          <th className="px-3 py-2 text-left font-medium">Note</th>
                          <th className="px-3 py-2 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.valid.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2 text-muted-foreground">{row.date}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.type === "income"
                                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                                  : "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300"
                              }`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-foreground">{row.category}</td>
                            <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">{row.note || "—"}</td>
                            <td className={`px-3 py-2 text-right font-medium tabular-nums ${
                              row.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                            }`}>
                              {row.type === "income" ? "+" : "−"}{row.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Skipped rows */}
              {result.skipped.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Skipped rows
                  </p>
                  <div className="rounded-xl border divide-y">
                    {result.skipped.map((s) => (
                      <div key={s.rowNum} className="px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Row {s.rowNum}:</span>{" "}
                        <span className="text-amber-700 dark:text-amber-400">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.valid.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                  <p className="font-medium">No valid rows found</p>
                  <p className="text-sm text-muted-foreground">
                    Make sure your CSV has columns: Date, Type, Category, Note, Amount.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={!result || result.valid.length === 0 || importing}
              data-testid="button-confirm-import"
            >
              {importing ? "Importing…" : `Import ${result?.valid.length ?? 0} transaction${result?.valid.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
