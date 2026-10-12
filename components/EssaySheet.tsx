import React from 'react';
import type { OfficialGrade, PageType } from '../types';
import { countWords } from '../sections';
import WritingArea from './desk/WritingArea';
import { PenCircle, Scribble, Tick } from './desk/PenMarks';

export interface SectionSummary {
  id: PageType;
  title: string;
  words: number;
  started: boolean;
  ready: boolean;
  /** Parts (and thesis) that still need fixing before marking. */
  issues: number;
  grade: OfficialGrade | null;
  marking: boolean;
}

interface EssaySheetProps {
  essayText: string;
  onEssayChange: (text: string) => void;
  onSplit: () => void;
  splitting: boolean;
  splitError: string | null;
  splitNotice: string | null;
  summaries: SectionSummary[];
  onOpenSection: (id: PageType) => void;
  onMarkAll: () => void;
  markingAll: boolean;
  markAllError: string | null;
  onClear: () => void;
}

const formatPoints = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
const pad = (n: number) => String(n).padStart(2, '0');
const CONTENT_MAX = 4.2;

const EssaySheet: React.FC<EssaySheetProps> = ({
  essayText,
  onEssayChange,
  onSplit,
  splitting,
  splitError,
  splitNotice,
  summaries,
  onOpenSection,
  onMarkAll,
  markingAll,
  markAllError,
  onClear,
}) => {
  const words = countWords(essayText);
  const paragraphs = essayText.split(/\n\s*\n|\n/).filter((p) => p.trim()).length;
  const ready = summaries.filter((s) => s.ready).length;
  const marked = summaries.filter((s) => s.grade);
  const points = Math.round(marked.reduce((sum, s) => sum + (s.grade?.points ?? 0), 0) * 100) / 100;
  const busy = splitting || markingAll;

  const markAllButton = (
    <button
      type="button"
      onClick={onMarkAll}
      disabled={ready === 0 || busy}
      className="inline-flex h-12 items-center justify-center gap-3 whitespace-nowrap rounded-sm bg-[var(--ink)] px-6 font-semibold text-[var(--paper)] shadow-[0_4px_14px_-6px_rgba(28,37,51,0.45)] transition-[transform,box-shadow,opacity,background-color] duration-200 hover:-translate-y-px hover:bg-[var(--pen)] hover:shadow-[0_10px_22px_-10px_rgba(192,57,43,0.6)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--ink)]"
    >
      {markingAll ? (
        <>
          <Scribble className="text-[var(--pen)]" /> Marking…
        </>
      ) : ready === 5 ? (
        <>
          <span className="sm:hidden">Mark all five</span>
          <span className="hidden sm:inline">Mark all five sections</span>
        </>
      ) : (
        <>
          <span className="sm:hidden">Mark ready ones</span>
          <span className="hidden sm:inline">Mark ready sections</span>
        </>
      )}
    </button>
  );

  const markHelp = markingAll
    ? "Diego's rubric is reading your sections. This takes about 15 seconds."
    : ready === 0
      ? 'Split your essay into sections first, or write the sections one by one.'
      : ready === 5
        ? 'Each section gets its level on Diego’s rubric and its own notes.'
        : `${ready} of 5 sections are ready. The others need fixing first.`;

  const count = (compact: boolean) => (
    <span className="whitespace-nowrap leading-none">
      <span className={`nums font-semibold text-[var(--ink)] ${compact ? 'text-lg' : 'text-2xl'}`}>{words}</span>
      <span className="text-sm text-[var(--ink-faint)]"> words</span>
      {!compact && (
        <span className="mt-2 block text-xs text-[var(--ink-soft)]">
          <span className="nums">{paragraphs}</span> {paragraphs === 1 ? 'paragraph' : 'paragraphs'} pasted
        </span>
      )}
    </span>
  );

  return (
    <>
      <section aria-label="Your essay" className="sheet sheet-margin [--margin-x:16px] lg:[--margin-x:212px]">
        <div className="grid lg:grid-cols-[212px_1fr]">
          {/* Margin: essay count and marking every section */}
          <aside className="hidden px-5 py-7 lg:block">
            <div className="sticky top-6 space-y-6">
              {count(false)}
              <div className="space-y-3">
                <div className="[&>button]:w-full [&>button]:px-2 [&>button]:text-[15px]">{markAllButton}</div>
                <p className="text-xs leading-relaxed text-[var(--ink-soft)]">{markHelp}</p>
                {markAllError && (
                  <p className="text-xs font-semibold text-[var(--pen)]" role="alert">
                    {markAllError}
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div className="min-w-0 px-7 py-7 lg:pl-6 lg:pr-10">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <label htmlFor="essay" className="display text-xl font-bold tracking-tight">
                  Paste your essay
                </label>
                <button
                  type="button"
                  onClick={onClear}
                  disabled={!essayText.trim()}
                  className="text-sm font-semibold text-[var(--ink-faint)] hover:text-[var(--pen)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[var(--ink-faint)]"
                >
                  Clear text
                </button>
              </div>
              <p id="essay-hint" className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">
                All five paragraphs, with a line break between them: introduction, body 1, body 2, counter-argument, conclusion.
                Each paragraph is split into its parts, without changing your words.
              </p>
              <WritingArea
                id="essay"
                className="mt-3"
                minRows={10}
                value={essayText}
                aria-describedby="essay-hint"
                onChange={(e) => onEssayChange(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <button
                  type="button"
                  onClick={onSplit}
                  disabled={words === 0 || busy}
                  className="inline-flex h-9 items-center gap-2 rounded-sm border border-[var(--ink)] px-3.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:cursor-not-allowed disabled:border-[var(--rule)] disabled:text-[var(--ink-faint)] disabled:hover:bg-transparent"
                >
                  {splitting ? (
                    <>
                      <Scribble className="text-[var(--pen)]" /> Splitting…
                    </>
                  ) : (
                    'Split into sections'
                  )}
                </button>
                <span className="text-xs text-[var(--ink-faint)] lg:hidden">
                  <span className="nums">{paragraphs}</span> {paragraphs === 1 ? 'paragraph' : 'paragraphs'}
                </span>
              </div>
              {splitError && (
                <p className="mt-2 text-sm text-[var(--pen)]" role="alert">
                  {splitError}
                </p>
              )}
              {splitNotice && (
                <p className="note-in mt-3 flex gap-2 text-sm leading-relaxed text-[var(--ink)]" role="status">
                  <Tick className="mt-0.5 shrink-0" />
                  <span>{splitNotice}</span>
                </p>
              )}
            </div>

            {/* The five sections, with what each still needs */}
            <div id="essay-sections" className="mt-10 scroll-mt-6 border-t border-[var(--rule)] pt-8">
              <h2 className="text-xl font-bold tracking-tight">Your five sections</h2>
              <ol className="mt-4 divide-y divide-[var(--rule)]">
                {summaries.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-4 py-4">
                    <span className="nums w-6 shrink-0 text-sm font-semibold text-[var(--ink-faint)]">{pad(i + 1)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="display text-lg font-bold tracking-tight">{s.title}</p>
                      <p className="mt-0.5 text-sm">
                        {!s.started ? (
                          <span className="text-[var(--ink-faint)]">Not started</span>
                        ) : (
                          <>
                            <span className="text-[var(--ink-soft)]">
                              <span className="nums">{s.words}</span> words ·{' '}
                            </span>
                            {s.grade ? (
                              <span className="text-[var(--ink-soft)]">Marked</span>
                            ) : s.ready ? (
                              <span className="font-semibold text-[var(--ink-support)]">Ready to mark</span>
                            ) : (
                              <span className="font-semibold text-[var(--pen)]">
                                <span className="nums">{s.issues}</span> {s.issues === 1 ? 'part' : 'parts'} to fix
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-5">
                      {s.marking ? (
                        <span className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                          <Scribble className="text-[var(--pen)]" /> Marking…
                        </span>
                      ) : s.grade ? (
                        <span className="flex items-center gap-4">
                          <PenCircle delayMs={150}>
                            <span className="nums block px-2 text-[var(--pen)]">
                              <span className="text-lg font-semibold">{formatPoints(s.grade.points)}</span>
                              <span className="text-xs">/{formatPoints(s.grade.maxPoints)}</span>
                            </span>
                          </PenCircle>
                          <span className="hidden text-sm font-semibold text-[var(--pen)] sm:inline">{s.grade.level}</span>
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onOpenSection(s.id)}
                        className="text-sm font-semibold text-[var(--ink)] underline decoration-[var(--pen)] decoration-2 underline-offset-4 hover:text-[var(--pen)]"
                      >
                        Open<span className="sr-only"> {s.title}</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              {marked.length > 0 && (
                <p className="mt-4 border-t border-[var(--rule)] pt-4 text-sm leading-relaxed text-[var(--ink-soft)]">
                  Content points so far:{' '}
                  <span className="nums font-semibold text-[var(--pen)]">
                    {formatPoints(points)}/{formatPoints(CONTENT_MAX)}
                  </span>{' '}
                  (<span className="nums">{marked.length}</span> of 5 sections marked). Grammar &amp; mechanics, worth{' '}
                  <span className="nums">0.8</span>, is marked on your whole essay, not here.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fixed bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-30 m-0 border-t border-[var(--rule)] bg-[var(--paper)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] lg:hidden">
        {(markAllError || markingAll) && (
          <p className={`mb-2 text-xs font-semibold ${markAllError ? 'text-[var(--pen)]' : 'text-[var(--ink-soft)]'}`} role={markAllError ? 'alert' : 'status'}>
            {markAllError ?? markHelp}
          </p>
        )}
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1">{count(true)}</div>
          {markAllButton}
        </div>
      </div>
    </>
  );
};

export default EssaySheet;
