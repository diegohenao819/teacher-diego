import React, { useState } from 'react';
import type { FeedbackResponse, InputField, ParagraphData } from '../types';
import { countWords, type SectionConfig } from '../sections';
import Highlighted from './desk/Highlighted';
import MarginNote from './desk/MarginNote';
import { Cross, HalfTick, PenCircle, Tick } from './desk/PenMarks';

interface MarkingReportProps {
  section: SectionConfig;
  feedback: FeedbackResponse;
  markedInputs: ParagraphData;
  stale: boolean;
  canApplyEdits: boolean;
  onApplyAllEdits: () => void;
}

const formatPoints = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
const textOf = (inputs: ParagraphData, field: InputField) => (inputs as Record<InputField, string>)[field] ?? '';

const MarkingReport: React.FC<MarkingReportProps> = ({
  section,
  feedback,
  markedInputs,
  stale,
  canApplyEdits,
  onApplyAllEdits,
}) => {
  const [copied, setCopied] = useState(false);
  const grade = feedback.officialGrade;
  const segments = section.parts.map((p) => ({ role: p.role, text: textOf(markedInputs, p.field) }));
  const words = section.parts.reduce((sum, p) => sum + countWords(textOf(markedInputs, p.field)), 0);
  const grammar = feedback.grammarAnalysis ?? [];
  const warnings = feedback.warnings ?? [];

  // Older responses without an official level fall back to the 0-5 criteria average.
  const fallbackScore =
    feedback.rubric.length > 0 ? feedback.rubric.reduce((s, r) => s + r.score, 0) / feedback.rubric.length : 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedback.rewrittenParagraph);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby="marked-heading" className="sheet sheet-margin overflow-hidden [--margin-x:16px] lg:[--margin-x:212px]">
      {/* Header: the circled level comes first */}
      <header className="flex flex-col gap-6 px-7 pt-9 pb-6 lg:block lg:min-h-[200px] lg:pl-[236px] lg:pr-10">
        <div className="min-w-0 max-w-3xl">
          <h2 id="marked-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {section.title}, marked
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {grade ? "Level on Diego's essay rubric" : 'Average of the criteria'} · <span className="nums">{words}</span> words
          </p>
          {grade?.justification && (
            <p className="ink-in on-grid mt-4 text-[17px] text-[var(--ink)]" style={{ '--delay': '600ms' } as React.CSSProperties}>
              {grade.justification}
            </p>
          )}
          {stale && (
            <p className="mt-3 text-sm font-semibold text-[var(--pen)]">
              You changed your text after this marking. Mark it again to see your new level.
            </p>
          )}
        </div>

        <div className="order-first flex items-center gap-8 pl-4 lg:absolute lg:left-0 lg:top-11 lg:w-[212px] lg:flex-col lg:gap-4 lg:pl-0">
          <PenCircle delayMs={200}>
            <span className="nums block px-3 py-1 text-[var(--pen)]">
              <span className="text-5xl font-semibold leading-none">
                {grade ? formatPoints(grade.points) : fallbackScore.toFixed(1)}
              </span>
              <span className="text-lg">/{grade ? formatPoints(grade.maxPoints) : '5.0'}</span>
            </span>
          </PenCircle>
          {grade && (
            <span className="ink-in display text-xl font-bold text-[var(--pen)]" style={{ '--delay': '650ms' } as React.CSSProperties}>
              {grade.level}
            </span>
          )}
        </div>
      </header>

      {/* The marked paragraph and what to improve */}
      <div className="grid gap-8 px-7 pb-9 lg:grid-cols-[1fr_320px] lg:pl-[236px] lg:pr-10">
        <div className="min-w-0">
          <Highlighted segments={segments} baseDelay={500} />
          {warnings.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm text-[var(--pen)]">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
        {feedback.suggestions.length > 0 && (
          <MarginNote delayMs={900}>
            <h3 className="text-lg font-bold">What to improve</h3>
            <ol className="mt-3 space-y-2.5">
              {feedback.suggestions.map((s, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="nums mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--pen)] text-xs font-semibold text-[var(--pen)]">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </MarginNote>
        )}
      </div>

      {/* Criteria and language */}
      <div className="grid gap-10 border-t border-[var(--rule)] bg-[var(--paper)] px-7 py-8 lg:grid-cols-[1fr_320px] lg:pl-[236px] lg:pr-10">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">Criteria</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {feedback.rubric.map((row, i) => {
                const full = row.score === 5;
                return (
                  <tr key={i} className="border-b border-[var(--rule)] align-top last:border-0">
                    <th scope="row" className="py-2.5 pr-3 text-left font-semibold sm:w-[38%]">
                      {row.criterion}
                      <span className="mt-0.5 block font-normal text-[var(--ink-soft)] sm:hidden">{row.rationale}</span>
                    </th>
                    <td className="hidden py-2.5 pr-3 text-[var(--ink-soft)] sm:table-cell">{row.rationale}</td>
                    <td className="nums w-16 whitespace-nowrap py-2.5 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        {full ? (
                          <Tick delayMs={1200 + i * 120} />
                        ) : row.score >= 3 ? (
                          <HalfTick delayMs={1200 + i * 120} />
                        ) : (
                          <Cross delayMs={1200 + i * 120} className="h-3.5 w-3.5" />
                        )}
                        <span className={full ? 'text-[var(--ink)]' : 'font-semibold text-[var(--pen)]'}>{row.score}/5</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-bold">
            Grammar &amp; vocabulary{' '}
            <span className="text-sm font-normal text-[var(--ink-soft)]">
              (<span className="nums">{grammar.length}</span> {grammar.length === 1 ? 'error' : 'errors'})
            </span>
          </h3>
          {grammar.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
              <Tick delayMs={1300} /> No grammar errors found.
            </p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {grammar.map((g, i) => (
                <li key={i}>
                  <span className="text-[var(--ink-soft)] line-through decoration-[var(--pen)] decoration-2">{g.error}</span>{' '}
                  <span className="font-semibold text-[var(--pen)]">→ {g.correction}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ink-faint)]">{g.explanation}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* A cleaner version of the paragraph */}
      <div className="border-t border-[var(--rule)] px-7 py-8 lg:pl-[236px] lg:pr-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <h3 className="text-lg font-bold">A cleaner version</h3>
          <div className="flex items-center gap-5">
            {canApplyEdits && (
              <button
                type="button"
                onClick={onApplyAllEdits}
                className="inline-flex h-9 items-center rounded-sm border border-[var(--ink)] px-3.5 text-sm font-semibold transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              >
                Use all suggested edits
              </button>
            )}
            <button
              type="button"
              onClick={copy}
              className="text-sm font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)]"
              aria-live="polite"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Your ideas, with the grammar and clarity fixed. Compare it with yours before you use it.</p>
        <p className="on-grid mt-4 max-w-3xl text-[17px] text-[var(--ink)]">{feedback.rewrittenParagraph}</p>
      </div>
    </section>
  );
};

export default MarkingReport;
