const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const SECRET_KEY = import.meta.env.VITE_SHEET_SYNC_SECRET as string;

// Map your app's category names (left) to the exact sheet column names (right).
// EDIT THE LEFT SIDE to match your app's real category names.
const CATEGORY_MAP: Record<string, string> = {
  "Transport": "local Bus",
  "Tea/Coffee": "Tea",
  "Eggs": "Egg",
  "Essentials": "Daily Essentials",
  "Dining Out": "Food out",
  "Fast Food": "Fast food",
  "Gym": "GYM",
  "Cab/Rapido": "Rapido/cab",
  "Train": "Train Book",
  "Travel": "Long travel",
  "Haircut": "Haircut",
  "Mobile Recharge": "Mobile pack",
  "Movie": "Movie",
};

export interface SyncTransaction {
  date: string;       // "YYYY-MM-DD"
  category: string;   // your app's category name (must be a key in CATEGORY_MAP)
  amount: number;
}

export async function syncTransactionToSheet(transaction: SyncTransaction) {
  if (!APPS_SCRIPT_URL) return;

  const sheetCategory = CATEGORY_MAP[transaction.category];
  if (!sheetCategory) {
    console.warn(`No sheet column mapped for category "${transaction.category}" — skipping sync.`);
    return;
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        date: transaction.date,
        category: sheetCategory,
        amount: transaction.amount,
        secretKey: SECRET_KEY,
      }),
    });
  } catch (err) {
    console.error("Sheet sync failed:", err);
  }
}

export interface ImportedTransaction {
  date: string;
  [category: string]: string | number;
}

export async function importFromSheet(year: string, month?: string) {
  const params = new URLSearchParams({ secretKey: SECRET_KEY, year });
  if (month) params.set("month", month.toUpperCase());
  const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
  const json = await res.json();
  if (json.status !== "ok") throw new Error(json.message || "Import failed");
  return json.data as Record<string, ImportedTransaction[]>;
}

// Reverse map, useful when importing sheet data back into your app's category names.
export const SHEET_TO_APP_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_MAP).map(([app, sheet]) => [sheet, app])
);
