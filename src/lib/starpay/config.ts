/**
 * Server-side StarPay configuration helpers.
 * Never import this module from client components.
 */

const PLACEHOLDER_API_KEY = 'your_starpay_api_secret_key';

export interface StarPayConfig {
  apiKey: string;
  baseUrl: string;
}

export function getStarPayConfig(): { apiKey?: string; baseUrl?: string } {
  return {
    apiKey: process.env.STARPAY_API_KEY?.trim() || undefined,
    baseUrl: process.env.STARPAY_BASE_URL?.trim() || undefined,
  };
}

/** Returns config when credentials are valid; null if missing or placeholder. */
export function requireStarPayConfig(): StarPayConfig | null {
  const { apiKey, baseUrl } = getStarPayConfig();
  if (!apiKey || !baseUrl || apiKey === PLACEHOLDER_API_KEY) return null;
  return { apiKey, baseUrl };
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
