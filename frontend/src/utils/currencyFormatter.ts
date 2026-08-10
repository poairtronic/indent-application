import { useMemo } from 'react';
import type { CurrencyFormat } from '../store/settingsStore';
import { useSettingsStore } from '../store/settingsStore';

interface CurrencyConfig {
  locale: string;
  currency: string;
  symbol: string;
}

const CURRENCY_CONFIG: Record<CurrencyFormat, CurrencyConfig> = {
  inr: { locale: 'en-IN', currency: 'INR', symbol: '₹' },
  usd: { locale: 'en-US', currency: 'USD', symbol: '$' },
  eur: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
};

/**
 * Format a numeric amount according to the user's selected currency format.
 * @param amount - Numeric value to format
 * @param format - Currency format key from settings store
 * @param options - Intl.NumberFormat options override
 */
export function formatCurrency(
  amount: number | null | undefined,
  format: CurrencyFormat = 'inr',
  options?: Intl.NumberFormatOptions,
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  const config = CURRENCY_CONFIG[format] ?? CURRENCY_CONFIG.inr;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Returns a pre-bound formatter function for the current currency setting.
 * Useful for formatting many values in a loop.
 */
export function getCurrencyFormatter(format: CurrencyFormat = 'inr') {
  return (amount: number | null | undefined) => formatCurrency(amount, format);
}

/**
 * Get the currency symbol for a given format.
 */
export function getCurrencySymbol(format: CurrencyFormat = 'inr'): string {
  return CURRENCY_CONFIG[format]?.symbol ?? '₹';
}

/**
 * Get the timezone offset label for display.
 */
export function getTimezoneLabel(tz: string): string {
  const map: Record<string, string> = {
    ist: 'Asia/Kolkata (IST, UTC+5:30)',
    utc: 'UTC (Universal Time)',
    est: 'America/New_York (EST, UTC-5)',
  };
  return map[tz] ?? tz;
}

/**
 * React hook that returns a currency formatter bound to the current settings.
 * Usage: const formatCurrency = useCurrencyFormatter();
 *        formatCurrency(42000) → '₹42,000' | '$42,000' | '€42,000'
 */
export function useCurrencyFormatter(
  options?: Intl.NumberFormatOptions,
): (amount: number | null | undefined) => string {
  const currencyFormat = useSettingsStore((s) => s.currencyFormat);
  return useMemo(() => {
    return (amount: number | null | undefined) => formatCurrency(amount, currencyFormat, options);
  }, [currencyFormat, options]);
}
