'use client';

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'nicole-studio-total-cost';

function getStoredTotal(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = parseFloat(raw || '0');
  return Number.isFinite(n) ? n : 0;
}

export function usePersistedTotalCost() {
  const [total, setTotal] = useState(() => getStoredTotal());

  const addCost = useCallback((delta: number) => {
    if (delta <= 0) return;
    setTotal((prev) => {
      const next = prev + delta;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next.toFixed(6));
      }
      return next;
    });
  }, []);

  return { total, addCost };
}
