const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const SECRET_KEY = import.meta.env.VITE_SHEET_SYNC_SECRET as string;

export interface SyncTransaction {
  date: string;     // "YYYY-MM-DD"
  category: string;
  amount: number;
  type: "income" | "expense";
}

export async function syncTransactionToSheet(transaction: SyncTransaction) {
  if (!APPS_SCRIPT_URL) return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...transaction, secretKey: SECRET_KEY, action: "add" }),
    });
  } catch (err) {
    console.error("Sheet sync failed:", err);
  }
}

export async function deleteTransactionFromSheet(transaction: SyncTransaction) {
  if (!APPS_SCRIPT_URL) return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...transaction, secretKey: SECRET_KEY, action: "delete" }),
    });
  } catch (err) {
    console.error("Sheet delete-sync failed:", err);
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

/** Converts sheet rows back into transactions. Reads whatever category columns
 * actually exist in the sheet, so custom categories import fine too. */
export function sheetDataToTransactions(data: Record<string, SheetRow[]>) {
  const transactions: {
    amount: number; type: "expense"; category: string; note: string; date: string;
  }[] = [];

  Object.values(data).forEach((rows) => {
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key === "date" || key === "Total/Day") return;
        const amount = Number(row[key]) || 0;
        if (amount > 0) {
          transactions.push({
            amount,
            type: "expense",
            category: key,
            note: "Imported from Google Sheet",
            date: row.date,
          });
        }
      });
    });
  });

  return transactions;
}