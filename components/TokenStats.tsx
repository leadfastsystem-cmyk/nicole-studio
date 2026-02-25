'use client';

import { Coins } from 'lucide-react';

interface TokenStatsProps {
  totalCost: number;
}

export default function TokenStats({ totalCost }: TokenStatsProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background-secondary)] text-sm">
      <Coins className="w-4 h-4 text-[var(--accent)]" />
      <span className="text-[var(--foreground-muted)]">
        Total: ${totalCost.toFixed(4)}
      </span>
    </div>
  );
}

