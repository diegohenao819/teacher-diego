// Word tally for one section: each part gets a slot sized to its word limit,
// filled with its highlighter, with a tick at the minimum.
import type { CSSProperties } from 'react';
import { WORD_LIMITS } from '../../constants';
import type { InputField } from '../../types';
import type { PartConfig } from '../../sections';

type Counts = Partial<Record<InputField, number>>;

const partState = (count: number, field: InputField) => {
  const { min, max } = WORD_LIMITS[field];
  if (count === 0) return 'empty';
  if (count < min) return 'short';
  if (count > max) return 'over';
  return 'ok';
};

export default function WordTally({
  parts,
  counts,
  compact = false,
}: {
  parts: PartConfig[];
  counts: Counts;
  compact?: boolean;
}) {
  const total = parts.reduce((sum, p) => sum + (counts[p.field] ?? 0), 0);
  const pending = parts.filter((p) => partState(counts[p.field] ?? 0, p.field) !== 'ok').length;
  const status =
    total === 0
      ? 'Start writing'
      : pending === 0
        ? compact
          ? 'Ready'
          : 'Every part in range'
        : compact
          ? `${pending} to go`
          : `${pending} ${pending === 1 ? 'part' : 'parts'} to go`;
  const statusColor = total === 0 ? 'text-[var(--ink-faint)]' : pending === 0 ? 'text-[var(--ink-support)]' : 'text-[var(--pen)]';

  return (
    <div className="w-full" role="group" aria-label={`${total} words. ${status}.`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="whitespace-nowrap leading-none">
          <span className={`nums font-semibold text-[var(--ink)] ${compact ? 'text-lg' : 'text-2xl'}`}>{total}</span>
          <span className="text-sm text-[var(--ink-faint)]"> words</span>
        </span>
        <span className={`whitespace-nowrap text-xs font-semibold ${statusColor}`} aria-live="polite">
          {status}
        </span>
      </div>

      <div className={`mt-2.5 flex gap-[3px] ${compact ? 'h-2' : 'h-3'}`} aria-hidden>
        {parts.map((p) => {
          const { min, max } = WORD_LIMITS[p.field];
          const count = counts[p.field] ?? 0;
          const state = partState(count, p.field);
          return (
            <div
              key={p.field}
              data-role={p.role}
              className={`relative overflow-hidden rounded-[2px] bg-[var(--rule)] ${state === 'over' ? 'outline outline-1 outline-[var(--pen)]' : ''}`}
              style={{ flexGrow: max, flexBasis: 0 } as CSSProperties}
            >
              <div
                className="h-full bg-[var(--hl)] transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${Math.min(count / max, 1) * 100}%` }}
              />
              <div className="absolute inset-y-0 w-px bg-[var(--margin-rule)]" style={{ left: `${(min / max) * 100}%` }} />
            </div>
          );
        })}
      </div>

      {!compact && (
        <dl className="mt-3 space-y-1 text-xs">
          {parts.map((p) => {
            const { min, max } = WORD_LIMITS[p.field];
            const count = counts[p.field] ?? 0;
            const state = partState(count, p.field);
            return (
              <div key={p.field} data-role={p.role} className="flex items-center justify-between gap-2">
                <dt className="flex min-w-0 items-center gap-1.5 text-[var(--ink-soft)]">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--hl)] ring-1 ring-[var(--part-ink)]" />
                  <span className="truncate">{p.label}</span>
                </dt>
                <dd
                  className={`nums whitespace-nowrap ${
                    state === 'ok' ? 'text-[var(--ink-support)]' : state === 'empty' ? 'text-[var(--ink-soft)]' : 'font-semibold text-[var(--pen)]'
                  }`}
                >
                  {count}
                  <span className="font-normal text-[var(--ink-faint)]">
                    /{min}–{max}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
