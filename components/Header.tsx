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
  activePage: PageType;
  onPageChange: (page: PageType) => void;
  statuses: Record<PageType, SectionStatus>;
}

const formatPoints = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

const Header: React.FC<HeaderProps> = ({ activePage, onPageChange, statuses }) => (
  <nav
    aria-label="Essay sections"
    className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-5 pb-6 sm:px-6 md:flex-nowrap"
  >
    <div className="flex items-baseline gap-2.5 text-[var(--ink)]">
      <span className="display text-lg font-bold tracking-tight sm:text-xl">Teacher Diego</span>
      <span className="text-sm text-[var(--ink-faint)]">Argumentative essay</span>
    </div>
    <ol className="-mx-2.5 flex w-full items-center overflow-x-auto [scrollbar-width:none] md:mx-0 md:w-auto">
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
              className={`relative flex items-baseline gap-1 rounded-sm px-2.5 py-1.5 text-sm transition-colors lg:px-3 ${
                active ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              <span className="md:hidden">{section.shortNavLabel}</span>
              <span className="hidden md:inline">{section.navLabel}</span>
              {status.points !== null ? (
                <span className="nums text-[11px] font-semibold text-[var(--pen)]">{formatPoints(status.points)}</span>
              ) : status.started ? (
                <span aria-hidden className="h-1.5 w-1.5 self-center rounded-full bg-[var(--ink-faint)]" />
              ) : null}
              {active && <PenUnderline className="absolute inset-x-2 -bottom-0.5 h-2 w-[calc(100%-1rem)]" />}
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

export default Header;
