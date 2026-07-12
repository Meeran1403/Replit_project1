const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const SECRET_KEY = import.meta.env.VITE_SHEET_SYNC_SECRET as string;

export interface SyncTransaction {
  date: string;     // "YYYY-MM-DD"
  category: string;
  amount: number;
}

export async function syncTransactionToSheet(transaction: SyncTransaction) {
  if (!APPS_SCRIPT_URL) return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...transaction, secretKey: SECRET_KEY }),
    });
  } catch (err) {
    console.error("Sheet sync failed:", err);
  }
}

export interface SheetRow {
  date: string;
  [category: string]: string | number;
}

export async function importFromSheet(year: string, month?: string) {
  const params = new URLSearchParams({ secretKey: SECRET_KEY, year });
  if (month) params.set("month", month.toUpperCase());
  const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
  const json = await res.json();
  if (json.status !== "ok") throw new Error(json.message || "Import failed");
  return json.data as Record<string, SheetRow[]>;
}

const EXPENSE_CATEGORIES = [
  "Food & Dining", "Groceries", "Junk Food", "Transportation", "Housing",
  "Entertainment", "Movies", "Healthcare", "Shopping", "Education",
  "Travel", "Utilities", "Recharge",
];

/** Converts sheet rows (one row per date, one column per category) back into
 * individual transactions, e.g. for the import feature. */
export function sheetDataToTransactions(data: Record<string, SheetRow[]>) {
  const transactions: {
    amount: number; type: "expense"; category: string; note: string; date: string;
  }[] = [];

  Object.values(data).forEach((rows) => {
    rows.forEach((row) => {
      EXPENSE_CATEGORIES.forEach((cat) => {
        const amount = Number(row[cat]) || 0;
        if (amount > 0) {
          transactions.push({
            amount,
            type: "expense",
            category: cat,
            note: "Imported from Google Sheet",
            date: row.date,
          });
        }
      });
    });
  });

  return transactions;
}
