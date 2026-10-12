import React from 'react';
import { PageType } from '../types';
import { SECTION_ORDER, SECTIONS } from '../sections';
import { PenUnderline } from './desk/PenMarks';

export interface SectionStatus {
  started: boolean;
  /** Points from the last marking, if this section has been marked. */
  points: number | null;
}

interface HeaderProps {
  /** The open section, or null when the full-essay page is open. */
  activePage: PageType | null;
  onPageChange: (page: PageType) => void;
  statuses: Record<PageType, SectionStatus>;
  onEssay: () => void;
}

const formatPoints = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

const Header: React.FC<HeaderProps> = ({ activePage, onPageChange, statuses, onEssay }) => {
  const essayActive = activePage === null;
  const essayButton = (className: string) => (
    <button
      type="button"
      onClick={onEssay}
      aria-label="Full essay"
      aria-current={essayActive ? 'page' : undefined}
      className={`relative rounded-sm px-2.5 py-1.5 text-sm transition-colors lg:px-3 ${
        essayActive ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
      } ${className}`}
    >
      Full essay
      {essayActive && <PenUnderline className="absolute inset-x-2 -bottom-0.5 h-2 w-[calc(100%-1rem)]" />}
    </button>
  );

  return (
  <nav
    aria-label="Essay sections"
    className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-5 pb-6 sm:px-6 md:flex-nowrap"
  >
    <div className="flex items-baseline gap-2.5 text-[var(--ink)]">
      <span className="display text-lg font-bold tracking-tight sm:text-xl">Teacher Diego</span>
      <span className="hidden text-sm text-[var(--ink-faint)] min-[420px]:inline">Argumentative essay</span>
    </div>
    {/* Phones: the full essay sits on the wordmark row, so the five sections keep their own row. */}
    {essayButton('-mr-2.5 md:hidden')}
    <ol className="-mx-2 flex w-full items-center overflow-x-auto [scrollbar-width:none] sm:-mx-2.5 md:mx-0 md:w-auto">
      {SECTION_ORDER.map((id) => {
        const section = SECTIONS[id];
        const status = statuses[id];
        const active = activePage === id;
        const statusText =
          status.points !== null
            ? `, marked ${formatPoints(status.points)} of ${formatPoints(section.points)}`
            : status.started
              ? ', in progress'
              : '';
        return (
          <li key={id} className="shrink-0">
            <button
              type="button"
              onClick={() => onPageChange(id)}
              aria-current={active ? 'page' : undefined}
              aria-label={`${section.title}${statusText}`}
              className={`relative flex items-baseline gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors sm:px-2.5 lg:px-3 ${
                active ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              <span className="md:hidden">{section.shortNavLabel}</span>
              <span className="hidden md:inline">{section.navLabel}</span>
              {status.points !== null ? (
                <>
                  {/* Phones: a red dot keeps the five sections on one row; points from md up. */}
                  <span aria-hidden className="h-1.5 w-1.5 self-center rounded-full bg-[var(--pen)] md:hidden" />
                  <span className="nums hidden text-[11px] font-semibold text-[var(--pen)] md:inline">{formatPoints(status.points)}</span>
                </>
              ) : status.started ? (
                <span aria-hidden className="h-1.5 w-1.5 self-center rounded-full bg-[var(--ink-faint)]" />
              ) : null}
              {active && <PenUnderline className="absolute inset-x-2 -bottom-0.5 h-2 w-[calc(100%-1rem)]" />}
            </button>
          </li>
        );
      })}
      <li aria-hidden className="mx-2 hidden h-4 w-px shrink-0 bg-[var(--rule)] md:block" />
      <li className="hidden shrink-0 md:block">{essayButton('')}</li>
    </ol>
  </nav>
  );
};

export default Header;
