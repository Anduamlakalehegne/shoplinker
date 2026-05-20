/**
 * Compare monetary amounts (e.g. ETB) to two decimal places.
 * Handles Supabase NUMERIC returned as number or string.
 */
export function amountsMatch(a: number | string, b: number | string): boolean {
  const aCents = Math.round(Number(a) * 100);
  const bCents = Math.round(Number(b) * 100);

  if (!Number.isFinite(aCents) || !Number.isFinite(bCents)) {
    return false;
  }

  return aCents === bCents;
}

/**
 * Format a number as Ethiopian Birr currency.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate a string to a given length.
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}
