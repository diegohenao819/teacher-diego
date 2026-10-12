import React, { useState, type CSSProperties } from 'react';
import { WORD_LIMITS } from '../constants';
import type { CoherenceStatus, FeedbackResponse, InputField, ParagraphData, ValidationState } from '../types';
import { THESIS_CONTEXT, countWords, type PartConfig, type SectionConfig } from '../sections';
import WritingArea from './desk/WritingArea';
import WordTally from './desk/WordTally';
import MarginNote from './desk/MarginNote';
import Highlighted from './desk/Highlighted';
import { Cross, Scribble, Tick } from './desk/PenMarks';

export type WriteMode = 'parts' | 'whole' | 'paste';

const MODES: { id: WriteMode; label: string; short: string }[] = [
  { id: 'parts', label: 'Part by part', short: 'Parts' },
  { id: 'whole', label: 'Whole paragraph', short: 'Whole' },
  { id: 'paste', label: 'Paste a paragraph', short: 'Paste' },
];

interface WritingSheetProps {
  section: SectionConfig;
  inputs: ParagraphData;
  counts: Partial<Record<InputField, number>>;
  validation: Partial<Record<InputField, ValidationState>>;
  onInputChange: (field: InputField, value: string) => void;
  mode: WriteMode;
  onModeChange: (mode: WriteMode) => void;
  canMark: boolean;
  isMarking: boolean;
  markError: string | null;
  onMark: () => void;
  coherence: CoherenceStatus;
  onCheckCoherence: () => void;
  onClear: () => void;
  feedback: FeedbackResponse | null;
  onApplyEdit: (field: InputField) => void;
  introThesis: string;
  /** Set when the current text has a marking: the phone bar then leads to it instead of re-marking. */
  marked: { points: number; maxPoints: number } | null;
  onSeeMarking: () => void;
  /** Hide the phone bar while the marked sheet is on screen. */
  hideBar: boolean;
  /** Paste mode: the pasted paragraph, and splitting it into the parts. */
  pasted: string;
  onPastedChange: (text: string) => void;
  onSplit: () => void;
  onMarkPasted: () => void;
  splitting: boolean;
  splitError: string | null;
  /** Shown above the parts right after a pasted paragraph was split into them. */
  splitNotice: string | null;
}

const formatPoints = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

const textOf = (inputs: ParagraphData, field: InputField) => (inputs as Record<InputField, string>)[field] ?? '';
const pad = (n: number) => String(n).padStart(2, '0');
// The word-range message is already shown by the counter; only show the others under the field.
const fieldMessage = (state?: ValidationState) =>
  state?.message && !state.message.startsWith('Must be') ? state.message : null;

function PartMeta({ field, count }: { field: InputField; count: number }) {
  const { min, max } = WORD_LIMITS[field];
  const ok = count >= min && count <= max;
  const figures = count === 0 ? 'text-[var(--ink-faint)]' : ok ? 'text-[var(--ink-support)]' : 'font-semibold text-[var(--pen)]';
  return (
    <span className="whitespace-nowrap text-xs text-[var(--ink-faint)]">
      <span className={`nums ${figures}`}>{count}</span> words · aim for <span className="nums">{min}–{max}</span>
    </span>
  );
}

function PartNotes({
  part,
  text,
  feedback,
  onApplyEdit,
}: {
  part: PartConfig;
  text: string;
  feedback: FeedbackResponse;
  onApplyEdit: (field: InputField) => void;
}) {
  const edit = (feedback.inlineEdits as Record<string, string | undefined>)[part.field];
  const showEdit = !!edit && edit.trim() !== text.trim();
  const lowered = text.toLowerCase();
  const corrections = (feedback.grammarAnalysis ?? []).filter(
    (g) => g.error.trim() && lowered.includes(g.error.trim().toLowerCase()),
  );

  const partKey = (
    <p className="text-xs font-bold text-[var(--part-ink)]">
      <span className="hl px-1">{part.label}</span>
    </p>
  );

  if (!showEdit && corrections.length === 0) {
    return (
      <MarginNote>
        {partKey}
        <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          <Tick /> No edits suggested for this part.
        </p>
      </MarginNote>
    );
  }

  return (
    <MarginNote>
      <div className="mb-2">{partKey}</div>
      {corrections.length > 0 && (
        <ul className="mb-3 space-y-2 text-sm">
          {corrections.map((g, i) => (
            <li key={i}>
              <span className="text-[var(--ink-soft)] line-through decoration-[var(--pen)] decoration-2">{g.error}</span>{' '}
              <span className="font-semibold text-[var(--pen)]">→ {g.correction}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ink-faint)]">{g.explanation}</span>
            </li>
          ))}
        </ul>
      )}
      {showEdit && (
        <>
          <p className="text-xs font-bold text-[var(--part-ink)]">Suggested edit</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">{edit}</p>
          <button
            type="button"
            onClick={() => onApplyEdit(part.field)}
            className="mt-2 text-sm font-semibold text-[var(--ink)] underline decoration-[var(--pen)] decoration-2 underline-offset-4 hover:text-[var(--pen)]"
          >
            Use this edit
          </button>
        </>
      )}
    </MarginNote>
  );
}

function Example({ part }: { part: PartConfig }) {
  return (
    <div className="text-sm">
      <p className="text-xs font-bold text-[var(--ink-faint)]">Example</p>
      <p className="on-grid mt-1 text-[15px] italic text-[var(--ink-soft)]">{part.example}</p>
    </div>
  );
}

const WritingSheet: React.FC<WritingSheetProps> = ({
  section,
  inputs,
  counts,
  validation,
  onInputChange,
  mode,
  onModeChange,
  canMark,
  isMarking,
  markError,
  onMark,
  coherence,
  onCheckCoherence,
  onClear,
  feedback,
  onApplyEdit,
  introThesis,
  marked,
  onSeeMarking,
  hideBar,
  pasted,
  onPastedChange,
  onSplit,
  onMarkPasted,
  splitting,
  splitError,
  splitNotice,
}) => {
  const pasteMode = mode === 'paste';
  const pastedWords = countWords(pasted);
  const canMarkNow = pasteMode ? pastedWords >= 15 && !splitting : canMark;
  const busy = isMarking || splitting;
  const [activeField, setActiveField] = useState<InputField | null>(null);
  const [openExamples, setOpenExamples] = useState<Partial<Record<InputField, boolean>>>({});
  const [thesisOpen, setThesisOpen] = useState(false);

  const checking = coherence.status === 'checking';
  const hasText = section.parts.some((p) => textOf(inputs, p.field).trim());
  const thesis = textOf(inputs, 'thesisContext');
  const canUseIntroThesis = section.needsThesis && introThesis.trim() && introThesis.trim() !== thesis.trim();

  const markButton = (
    <button
      type="button"
      onClick={pasteMode ? onMarkPasted : onMark}
      disabled={!canMarkNow || busy}
      className="inline-flex h-12 items-center justify-center gap-3 whitespace-nowrap rounded-sm bg-[var(--ink)] px-6 font-semibold text-[var(--paper)] shadow-[0_4px_14px_-6px_rgba(28,37,51,0.45)] transition-[transform,box-shadow,opacity,background-color] duration-200 hover:-translate-y-px hover:bg-[var(--pen)] hover:shadow-[0_10px_22px_-10px_rgba(192,57,43,0.6)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[var(--ink)]"
    >
      {busy ? (
        <>
          <Scribble className="text-[var(--pen)]" /> {splitting ? 'Splitting…' : 'Marking…'}
        </>
      ) : (
        'Mark my paragraph'
      )}
    </button>
  );

  const allWritten = section.parts.every((p) => (counts[p.field] ?? 0) > 0);
  const offRange = section.parts.filter((p) => {
    const { min, max } = WORD_LIMITS[p.field];
    const n = counts[p.field] ?? 0;
    return n > 0 && (n < min || n > max);
  }).length;
  const thesisReady = !section.needsThesis || validation.thesisContext?.isValid === true;
  const markHelp = splitting
    ? 'Finding the parts of your paragraph…'
    : isMarking
    ? "Diego's rubric is reading your paragraph. This takes about 15 seconds."
    : pasteMode
      ? pastedWords >= 15
        ? 'Your paragraph is split into its parts, then marked.'
        : 'Paste your paragraph to get it marked.'
    : canMark
      ? offRange > 0
        ? `${offRange} ${offRange === 1 ? 'part is' : 'parts are'} outside the suggested word range. That is only a guide: you can still mark it.`
        : "You get the level on Diego's rubric, notes on each part, and a cleaner version."
      : !allWritten
        ? 'Write every part to get your paragraph marked.'
        : !thesisReady
          ? 'Add your thesis at the top to get your paragraph marked.'
          : 'Fix the notes in red under your parts to get your paragraph marked.';

  const pastedCount = (compact: boolean) => (
    <div className="flex items-baseline justify-between gap-2" aria-live="polite">
      <span className="whitespace-nowrap leading-none">
        <span className={`nums font-semibold text-[var(--ink)] ${compact ? 'text-lg' : 'text-2xl'}`}>{pastedWords}</span>
        <span className="text-sm text-[var(--ink-faint)]"> words pasted</span>
      </span>
    </div>
  );

  const coherenceBlock = (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onCheckCoherence}
        disabled={!canMark || checking || isMarking}
        className="inline-flex h-9 items-center gap-2 rounded-sm border border-[var(--ink)] px-3.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:cursor-not-allowed disabled:border-[var(--rule)] disabled:text-[var(--ink-faint)] disabled:hover:bg-transparent"
      >
        {checking ? (
          <>
            <Scribble className="text-[var(--pen)]" /> Checking…
          </>
        ) : (
          'Check coherence'
        )}
      </button>
      {coherence.status === 'idle' && (
        <p className="text-xs leading-relaxed text-[var(--ink-soft)]">A quick check that your parts connect logically.</p>
      )}
      {(coherence.status === 'success' || coherence.status === 'error') && (
        <p className="note-in flex gap-2 text-sm leading-relaxed text-[var(--ink)]" role="status">
          {coherence.status === 'success' ? <Tick className="mt-0.5 shrink-0" /> : <Cross className="mt-0.5 shrink-0" />}
          <span>
            <span className={`font-semibold ${coherence.status === 'error' ? 'text-[var(--pen)]' : ''}`}>
              {coherence.status === 'success' ? 'Your parts connect. ' : 'Check the logic. '}
            </span>
            {coherence.message}
          </span>
        </p>
      )}
    </div>
  );

  return (
    <>
      <section aria-label={`Your ${section.noun}`} className="sheet sheet-margin [--margin-x:16px] lg:[--margin-x:212px]">
        <div className="grid lg:grid-cols-[212px_1fr]">
          {/* Margin: word tally, marking and coherence */}
          <aside className="hidden px-5 py-7 lg:block">
            <div className="sticky top-6 space-y-6">
              {pasteMode ? pastedCount(false) : <WordTally parts={section.parts} counts={counts} />}
              <div className="space-y-3">
                <div className="[&>button]:w-full [&>button]:px-2 [&>button]:text-[15px]">{markButton}</div>
                <p className="text-xs leading-relaxed text-[var(--ink-soft)]">{markHelp}</p>
                {markError && (
                  <p className="text-xs font-semibold text-[var(--pen)]" role="alert">
                    {markError}
                  </p>
                )}
              </div>
              <div className="border-t border-[var(--rule)] pt-5">{coherenceBlock}</div>
            </div>
          </aside>

          <div className="min-w-0 px-7 py-7 lg:pl-6 lg:pr-10">
            {/* Sheet bar: mode switch and clear */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div
                role="tablist"
                aria-label="How do you want to write your paragraph?"
                className="relative grid w-full grid-cols-3 rounded-sm border border-[var(--rule)] bg-[var(--paper)] p-1 text-sm font-semibold sm:w-auto"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-[2px] bg-[var(--ink)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: `translateX(${MODES.findIndex((m) => m.id === mode) * 100}%)` }}
                />
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    role="tab"
                    type="button"
                    aria-selected={mode === m.id}
                    aria-label={m.label}
                    onClick={() => onModeChange(m.id)}
                    className={`relative z-10 whitespace-nowrap px-3 py-1.5 transition-colors duration-300 sm:px-4 ${
                      mode === m.id ? 'text-[var(--paper)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <span className="sm:hidden">{m.short}</span>
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onClear}
                disabled={!hasText && !thesis.trim() && !pasted.trim()}
                className="ml-auto hidden text-sm font-semibold text-[var(--ink-faint)] hover:text-[var(--pen)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[var(--ink-faint)] sm:block"
              >
                Clear text
              </button>
            </div>

            {/* The thesis, for checking body and counter-argument paragraphs */}
            {section.needsThesis && mode === 'parts' && (
              <div
                data-role={THESIS_CONTEXT.role}
                className="mt-6 rounded-sm border border-dashed border-[var(--rule)] bg-[var(--paper)] px-4 py-3"
              >
                {validation.thesisContext?.isValid && !thesisOpen ? (
                  // Filled in: one line, so the first part stays in view on a phone.
                  <div className="flex items-baseline gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm">
                      <span className="hl font-semibold">Your thesis</span>{' '}
                      <span className="text-[var(--ink-soft)]">{thesis}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setThesisOpen(true)}
                      className="shrink-0 text-sm font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)]"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <label htmlFor="thesisContext" className="text-sm font-semibold">
                        <span className="hl">Your thesis</span>{' '}
                        <span className="font-normal text-[var(--ink-faint)]">· {THESIS_CONTEXT.hint}</span>
                      </label>
                      <PartMeta field="thesisContext" count={counts.thesisContext ?? 0} />
                    </div>
                    {canUseIntroThesis && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onInputChange('thesisContext', introThesis.trim())}
                        className="mt-2 text-sm font-semibold text-[var(--ink)] underline decoration-[var(--pen)] decoration-2 underline-offset-4 hover:text-[var(--pen)]"
                      >
                        Use the thesis from your introduction
                      </button>
                    )}
                    <WritingArea
                      id="thesisContext"
                      className="mt-3"
                      minRows={THESIS_CONTEXT.minRows}
                      value={thesis}
                      autoFocus={thesisOpen}
                      onFocus={() => setThesisOpen(true)}
                      onBlur={() => setThesisOpen(false)}
                      onChange={(e) => onInputChange('thesisContext', e.target.value)}
                    />
                    {fieldMessage(validation.thesisContext) && (
                      <p className="mt-2 text-sm text-[var(--pen)]">{fieldMessage(validation.thesisContext)}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {mode === 'parts' && splitNotice && (
              <p className="note-in mt-6 flex gap-2 text-sm leading-relaxed text-[var(--ink)]" role="status">
                <Tick className="mt-0.5 shrink-0" />
                <span>{splitNotice}</span>
              </p>
            )}

            {mode === 'paste' ? (
              <div className="ink-in mt-8 grid gap-x-8 gap-y-6 xl:grid-cols-[1fr_300px]" key="paste">
                <div className="min-w-0">
                  <label htmlFor="pasted" className="display text-xl font-bold tracking-tight">
                    Paste your {section.noun}
                  </label>
                  <p id="pasted-hint" className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">
                    One paragraph. It is split into its {section.parts.length} parts, each in its own box, without changing your words.
                  </p>
                  <WritingArea
                    id="pasted"
                    className="mt-3"
                    minRows={8}
                    value={pasted}
                    aria-describedby="pasted-hint"
                    onChange={(e) => onPastedChange(e.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <button
                      type="button"
                      onClick={onSplit}
                      disabled={pastedWords === 0 || busy}
                      className="inline-flex h-9 items-center gap-2 rounded-sm border border-[var(--ink)] px-3.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:cursor-not-allowed disabled:border-[var(--rule)] disabled:text-[var(--ink-faint)] disabled:hover:bg-transparent"
                    >
                      {splitting ? (
                        <>
                          <Scribble className="text-[var(--pen)]" /> Splitting…
                        </>
                      ) : (
                        'Split into parts'
                      )}
                    </button>
                    <span className="text-xs text-[var(--ink-faint)]">
                      <span className="nums">{pastedWords}</span> words
                    </span>
                  </div>
                  {splitError && (
                    <p className="mt-2 text-sm text-[var(--pen)]" role="alert">
                      {splitError}
                    </p>
                  )}
                </div>
                <ol className="space-y-3 xl:pt-9" aria-label="Parts it is split into">
                  {section.parts.map((p) => (
                    <li key={p.field} data-role={p.role} className="text-sm">
                      <span className="font-semibold">
                        <span className="hl">{p.label}</span>
                      </span>
                      <span className="mt-0.5 block leading-relaxed text-[var(--ink-soft)]">{p.hint}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : mode === 'parts' ? (
              <ol className="mt-8 space-y-10" key="parts">
                {section.parts.map((part, i) => {
                  const text = textOf(inputs, part.field);
                  const active = activeField === part.field;
                  const message = fieldMessage(validation[part.field]);
                  return (
                    <li
                      key={part.field}
                      data-role={part.role}
                      className={`ink-in grid gap-x-8 gap-y-4 transition-opacity duration-300 xl:grid-cols-[1fr_300px] ${
                        activeField && !active ? 'opacity-45 hover:opacity-100' : ''
                      }`}
                      style={{ '--delay': `${i * 70}ms` } as CSSProperties}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <label htmlFor={part.field} className="flex items-baseline gap-3">
                            <span className="nums text-sm font-semibold text-[var(--part-ink)]">{pad(i + 1)}</span>
                            <span className="display text-xl font-bold tracking-tight">
                              <span key={active ? 'on' : 'off'} className={active || text.trim() ? `hl ${active ? 'hl-swipe' : ''}` : ''}>
                                {part.label}
                              </span>
                            </span>
                          </label>
                          <PartMeta field={part.field} count={counts[part.field] ?? 0} />
                        </div>
                        <p id={`${part.field}-hint`} className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">
                          {part.hint}
                        </p>
                        <WritingArea
                          id={part.field}
                          className="mt-3"
                          value={text}
                          minRows={part.minRows}
                          aria-describedby={`${part.field}-hint`}
                          onFocus={() => setActiveField(part.field)}
                          onBlur={() => setActiveField((f) => (f === part.field ? null : f))}
                          onChange={(e) => onInputChange(part.field, e.target.value)}
                        />
                        {message && <p className="mt-2 text-sm text-[var(--pen)]">{message}</p>}
                        <div className="xl:hidden">
                          <button
                            type="button"
                            aria-expanded={!!openExamples[part.field]}
                            onClick={() => setOpenExamples((o) => ({ ...o, [part.field]: !o[part.field] }))}
                            className="mt-2 text-xs font-semibold text-[var(--ink-faint)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
                          >
                            {openExamples[part.field] ? 'Hide the example' : 'See an example'}
                          </button>
                          {openExamples[part.field] && (
                            <p className="ink-in on-grid mt-2 text-[15px] italic text-[var(--ink-soft)]">{part.example}</p>
                          )}
                        </div>
                      </div>

                      {/* Note column: Diego's marking for this part, then the example */}
                      {(feedback || part.example) && (
                        <div className={`min-w-0 space-y-6 xl:pt-9 ${feedback ? '' : 'hidden xl:block'}`}>
                          {feedback && <PartNotes part={part} text={text} feedback={feedback} onApplyEdit={onApplyEdit} />}
                          <div className="hidden xl:block">
                            <Example part={part} />
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="ink-in mt-8 grid gap-x-8 gap-y-6 xl:grid-cols-[1fr_300px]" key="whole">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight">Your {section.noun}</h2>
                  <p className="mt-1.5 text-sm text-[var(--ink-soft)]">
                    Your parts joined into one paragraph. To change it, go back to Part by part.
                  </p>
                  {hasText ? (
                    <Highlighted
                      className="mt-4"
                      segments={section.parts.map((p) => ({ role: p.role, text: textOf(inputs, p.field) }))}
                    />
                  ) : (
                    <p className="on-grid mt-4 text-[17px] text-[var(--ink-faint)]">
                      Nothing written yet. Your paragraph appears here, each part highlighted.
                    </p>
                  )}
                </div>
                <ol className="space-y-3 xl:pt-9" aria-label="Parts of this paragraph">
                  {section.parts.map((p) => (
                    <li key={p.field} data-role={p.role} className="text-sm">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-semibold">
                          <span className="hl">{p.label}</span>
                        </span>
                        <PartMeta field={p.field} count={counts[p.field] ?? 0} />
                      </span>
                      <span className="mt-0.5 block leading-relaxed text-[var(--ink-soft)]">{p.hint}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-10 flex items-start justify-between gap-4 border-t border-[var(--rule)] pt-6 lg:hidden">
              {coherenceBlock}
              <button
                type="button"
                onClick={onClear}
                disabled={!hasText && !thesis.trim() && !pasted.trim()}
                className="mt-2 shrink-0 text-sm font-semibold text-[var(--ink-faint)] hover:text-[var(--pen)] disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
              >
                Clear text
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed bar on phones: word tally and the marking button, or a way back to the marking */}
      <div
        inert={hideBar}
        className={`fixed inset-x-0 bottom-0 z-30 m-0 border-t border-[var(--rule)] bg-[var(--paper)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          hideBar ? 'translate-y-full' : ''
        }`}
      >
        {(markError || busy || (!pasteMode && !canMark && allWritten)) && (
          <p className={`mb-2 text-xs font-semibold ${markError ? 'text-[var(--pen)]' : 'text-[var(--ink-soft)]'}`} role={markError ? 'alert' : 'status'}>
            {markError ?? markHelp}
          </p>
        )}
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1">
            {pasteMode ? pastedCount(true) : <WordTally parts={section.parts} counts={counts} compact />}
          </div>
          {marked && !busy && !pasteMode ? (
            <button
              type="button"
              onClick={onSeeMarking}
              className="inline-flex h-12 items-center gap-3 whitespace-nowrap rounded-sm border border-[var(--ink)] bg-[var(--paper)] px-4 font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            >
              See your marking
              <span className="nums text-[var(--pen)]">
                {formatPoints(marked.points)}
                <span className="text-xs">/{formatPoints(marked.maxPoints)}</span>
              </span>
            </button>
          ) : (
            markButton
          )}
        </div>
      </div>
    </>
  );
};

export default WritingSheet;
