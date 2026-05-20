import { useSyncExternalStore } from 'react';

/**
 * Returns true only after the component has mounted on the client.
 * Uses useSyncExternalStore to avoid hydration mismatches without effect setState.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
