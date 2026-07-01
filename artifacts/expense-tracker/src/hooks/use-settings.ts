import { useState, useCallback } from "react";
import type { StorageType } from "@/lib/storage";

export { type StorageType };

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "EGP", symbol: "£", name: "Egyptian Pound" },
];

export interface UserSettings {
  name: string;
  currency: string;
  currencySymbol: string;
  startingBalance: number;
  storageType: StorageType;
  onboardingComplete: boolean;
}

const SETTINGS_KEY = "expense-tracker-settings";

const DEFAULT_SETTINGS: UserSettings = {
  name: "",
  currency: "USD",
  currencySymbol: "$",
  startingBalance: 0,
  storageType: "localStorage",
  onboardingComplete: false,
};

function readSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(readSettings);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(
    (data: Omit<UserSettings, "onboardingComplete">) => {
      const next: UserSettings = { ...data, onboardingComplete: true };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      setSettings(next);
    },
    []
  );

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(SETTINGS_KEY);
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  return { settings, updateSettings, completeOnboarding, resetOnboarding };
}
