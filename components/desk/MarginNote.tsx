// A margin note tied to its part by a thin red-pen bracket.
import type { CSSProperties, ReactNode } from 'react';

export default function MarginNote({
  children,
  delayMs = 0,
  className = '',
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  return (
    <div className={`note-in relative flex gap-3 ${className}`} style={{ '--delay': `${delayMs}ms` } as CSSProperties}>
      <div aria-hidden className="flex w-2 shrink-0 flex-col items-end text-[var(--pen)]">
        <svg viewBox="0 0 8 10" className="h-2.5 w-2">
          <path d="M8 1 C 3 1, 1 3, 1 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <div className="w-px flex-1 self-start bg-current" style={{ marginLeft: '0.5px' }} />
        <svg viewBox="0 0 8 10" className="h-2.5 w-2">
          <path d="M1 1 C 1 7, 3 9, 8 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1 py-1">{children}</div>
    </div>
  );
}
