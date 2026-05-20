'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/useCartStore';

/**
 * Returns true once the Zustand persist middleware has finished
 * loading cart state from localStorage.
 *
 * SSR-safe: always starts as false on the server / during prerendering.
 * Only accesses persist APIs inside useEffect (client-only).
 */
export function useCartHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Use Promise.resolve to defer the setState call out of the synchronous
    // effect body, satisfying react-hooks/set-state-in-effect lint rule
    // while still updating on the very next microtask tick.
    if (useCartStore.persist.hasHydrated()) {
      Promise.resolve().then(() => setHasHydrated(true));
      return;
    }

    const unsub = useCartStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return unsub;
  }, []);

  return hasHydrated;
}
