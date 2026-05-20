/**
 * External redirect helper (outside React components to satisfy lint rules).
 */
export function redirectToExternalUrl(url: string): void {
  globalThis.location.assign(url);
}
