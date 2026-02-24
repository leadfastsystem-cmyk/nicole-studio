'use client';

interface FileExpiryBadgeProps {
  expiresAt: Date;
}

export default function FileExpiryBadge({ expiresAt }: FileExpiryBadgeProps) {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const daysLeft = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  let bg = 'bg-[var(--background-secondary)]';
  let text = 'text-[var(--foreground-muted)]';

  if (daysLeft <= 3) {
    bg = 'bg-red-100';
    text = 'text-red-600';
  } else if (daysLeft <= 7) {
    bg = 'bg-amber-100';
    text = 'text-amber-600';
  }

  return (
    <div
      className={`absolute bottom-1 right-1 px-2 py-0.5 rounded-full text-[10px] ${bg} ${text}`}
    >
      {daysLeft > 0 ? `${daysLeft}d` : 'Hoy'}
    </div>
  );
}

