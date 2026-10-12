import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Header, { type SectionStatus } from "./components/Header";
import WritingSheet, { type WriteMode } from "./components/WritingSheet";
import MarkingReport from "./components/MarkingReport";
import EssaySheet, { type SectionSummary } from "./components/EssaySheet";
import {
  BANNED_PHRASES_REGEX,
  EMPTY_BODY_INPUT,
  EMPTY_CONCLUSION_INPUT,
  EMPTY_COUNTER_ARGUMENT_INPUT,
  EMPTY_INTRODUCTION_INPUT,
  EMPTY_SETTINGS,
} from "./constants";
import { checkCoherence, getFeedback, splitText } from "./services/openaiService";
import { SECTION_ORDER, SECTIONS, countWords } from "./sections";
import {
  CoherenceStatus,
  FeedbackResponse,
  InputField,
  PageType,
  ParagraphData,
  Settings,
  ValidationState,
} from "./types";

// --- Local Storage Keys (kept so students' saved drafts survive the redesign) ---
const STORAGE_KEYS: Record<PageType, string> = {
  introduction: "teacherDiego_introductionInputs",
  body: "teacherDiego_bodyInputs",
  body2: "teacherDiego_body2Inputs",
  counterArgument: "teacherDiego_counterArgumentInputs",
  conclusion: "teacherDiego_conclusionInputs",
};
const ACTIVE_PAGE_KEY = "teacherDiego_activePage";
const PASTED_KEY = "teacherDiego_pasted";
const ESSAY_VIEW = "essay";

const EMPTY_INPUTS: Record<PageType, ParagraphData> = {
  introduction: EMPTY_INTRODUCTION_INPUT,
  body: EMPTY_BODY_INPUT,
  body2: EMPTY_BODY_INPUT,
  counterArgument: EMPTY_COUNTER_ARGUMENT_INPUT,
  conclusion: EMPTY_CONCLUSION_INPUT,
};
// A saved object must contain this field to belong to the page.
const REQUIRED_FIELD: Record<PageType, string> = {
  introduction: "thesis",
  body: "claim",
  body2: "claim",
  counterArgument: "counterArgument",
  conclusion: "restatement",
};

type PageState = {
  inputs: ParagraphData;
  feedback: FeedbackResponse | null;
  /** The inputs that were marked, to read the paragraph back and detect later changes. */
  markedInputs: ParagraphData | null;
  coherence: CoherenceStatus;
};

/** Pasted text: one paragraph per section, plus the whole essay. */
type Pasted = Record<PageType | typeof ESSAY_VIEW, string>;

const emptyPage = (page: PageType): PageState => ({
  inputs: EMPTY_INPUTS[page],
  feedback: null,
  markedInputs: null,
  coherence: { status: "idle" },
});

function loadPage(page: PageType): PageState {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS[page]);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === "object" && parsed !== null && REQUIRED_FIELD[page] in parsed) {
        return { ...emptyPage(page), inputs: { ...EMPTY_INPUTS[page], ...parsed } };
      }
    }
  } catch (e) {
    console.error(`Failed to read saved ${page} inputs`, e);
    localStorage.removeItem(STORAGE_KEYS[page]);
  }
  return emptyPage(page);
}

function loadView(): { page: PageType; essay: boolean } {
  try {
    const saved = localStorage.getItem(ACTIVE_PAGE_KEY);
    if (saved === ESSAY_VIEW) return { page: "introduction", essay: true };
    if (saved && saved in SECTIONS) return { page: saved as PageType, essay: false };
  } catch {
    /* storage unavailable */
  }
  return { page: "introduction", essay: false };
}

const EMPTY_PASTED: Pasted = { introduction: "", body: "", body2: "", counterArgument: "", conclusion: "", essay: "" };

function loadPasted(): Pasted {
  try {
    const saved = JSON.parse(localStorage.getItem(PASTED_KEY) ?? "null");
    if (saved && typeof saved === "object") return { ...EMPTY_PASTED, ...saved };
  } catch {
    /* storage unavailable */
  }
  return EMPTY_PASTED;
}

const fieldsOf = (inputs: ParagraphData) => Object.keys(inputs) as InputField[];
const textOf = (inputs: ParagraphData, field: InputField) => (inputs as Record<InputField, string>)[field] ?? "";
const sameInputs = (a: ParagraphData, b: ParagraphData) =>
  fieldsOf(a).every((f) => textOf(a, f).trim() === textOf(b, f).trim());
const formatPoints = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
const NUMBER_WORDS = ["", "One", "Two", "Three", "Four", "Five"];
const partsText = (page: PageType, inputs: ParagraphData) =>
  SECTIONS[page].parts.map((p) => textOf(inputs, p.field).trim()).filter(Boolean).join(" ");

// Word limits are only a guide (shown by the counters); they never block marking.
// A part must be written, and the meta-phrase and two-reasons rules still apply.
function validate(inputs: ParagraphData, page: PageType): Partial<Record<InputField, ValidationState>> {
  const result: Partial<Record<InputField, ValidationState>> = {};
  for (const field of fieldsOf(inputs)) {
    const text = textOf(inputs, field);
    if (text.trim().length === 0) {
      result[field] = { isValid: false };
    } else if (BANNED_PHRASES_REGEX.test(text)) {
      result[field] = { isValid: false, message: 'Avoid meta-phrases like "This essay will...".' };
    } else if (page === "introduction" && field === "thesis" && /\b(multiple|several|many|various) reasons\b/i.test(text)) {
      result[field] = { isValid: false, message: "Be specific; name your two reasons." };
    } else {
      result[field] = { isValid: true };
    }
  }
  return result;
}

const allValid = (v: Partial<Record<InputField, ValidationState>>) =>
  (Object.values(v) as (ValidationState | undefined)[]).every((s) => s?.isValid === true);

function App() {
  const [initialView] = useState(loadView);
  const [activePage, setActivePage] = useState<PageType>(initialView.page);
  const [essayOpen, setEssayOpen] = useState(initialView.essay);
  const [pages, setPages] = useState<Record<PageType, PageState>>(() => ({
    introduction: loadPage("introduction"),
    body: loadPage("body"),
    body2: loadPage("body2"),
    counterArgument: loadPage("counterArgument"),
    conclusion: loadPage("conclusion"),
  }));
  const [pasted, setPasted] = useState<Pasted>(loadPasted);
  const [mode, setMode] = useState<WriteMode>("parts");
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [splitNotice, setSplitNotice] = useState<string | null>(null);
  const [markingPages, setMarkingPages] = useState<PageType[]>([]);
  const [markAllError, setMarkAllError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const scrollToReportNext = useRef(false);
  const [reportVisible, setReportVisible] = useState(false);

  const section = SECTIONS[activePage];
  const activeState = pages[activePage];

  const updatePage = useCallback((page: PageType, update: (prev: PageState) => PageState) => {
    setPages((prev) => ({ ...prev, [page]: update(prev[page]) }));
  }, []);

  // Save each page's inputs, and the pasted text, as the student writes.
  useEffect(() => {
    for (const page of SECTION_ORDER) {
      localStorage.setItem(STORAGE_KEYS[page], JSON.stringify(pages[page].inputs));
    }
  }, [pages]);

  useEffect(() => {
    try {
      localStorage.setItem(PASTED_KEY, JSON.stringify(pasted));
    } catch {
      /* storage unavailable */
    }
  }, [pasted]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PAGE_KEY, essayOpen ? ESSAY_VIEW : activePage);
    } catch {
      /* storage unavailable */
    }
  }, [activePage, essayOpen]);

  const scrollToReport = useCallback(() => {
    reportRef.current?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  // The phone bar steps aside while the marked sheet fills the lower part of the screen.
  useEffect(() => {
    const check = () => {
      const rect = reportRef.current?.getBoundingClientRect();
      setReportVisible(!!rect && rect.height > 0 && rect.top < window.innerHeight * 0.65 && rect.bottom > 0);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [activeState.feedback, activePage, essayOpen]);

  // After a new marking arrives, bring the circled level into view.
  useEffect(() => {
    if (scrollToReportNext.current && activeState.feedback) {
      scrollToReportNext.current = false;
      requestAnimationFrame(scrollToReport);
    }
  }, [activeState.feedback, scrollToReport]);

  const handleInputChange = useCallback(
    (field: InputField, value: string) => {
      setSplitNotice(null);
      updatePage(activePage, (prev) => ({
        ...prev,
        inputs: { ...prev.inputs, [field]: value },
        coherence: prev.coherence.status !== "idle" ? { status: "idle" } : prev.coherence,
      }));
    },
    [activePage, updatePage],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(fieldsOf(activeState.inputs).map((f) => [f, countWords(textOf(activeState.inputs, f))])) as Partial<
        Record<InputField, number>
      >,
    [activeState.inputs],
  );

  const validation = useMemo(() => validate(activeState.inputs, activePage), [activeState.inputs, activePage]);
  const isFormValid = useMemo(() => allValid(validation), [validation]);

  const handleCoherenceCheck = useCallback(async () => {
    if (!isFormValid) return;
    const page = activePage;
    updatePage(page, (prev) => ({ ...prev, coherence: { status: "checking" } }));
    try {
      const result = await checkCoherence(pages[page].inputs);
      updatePage(page, (prev) => ({
        ...prev,
        coherence: { status: result.isCoherent ? "success" : "error", message: result.reason },
      }));
    } catch {
      updatePage(page, (prev) => ({
        ...prev,
        coherence: { status: "error", message: "Couldn't run the check. Check your connection and try again." },
      }));
    }
  }, [activePage, isFormValid, pages, updatePage]);

  const markInputs = async (page: PageType, marked: ParagraphData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getFeedback({ ...marked, ...settings });
      scrollToReportNext.current = true;
      updatePage(page, (prev) => ({ ...prev, feedback: response, markedInputs: marked }));
    } catch (e) {
      setError("Couldn't get your marking. Check your connection and try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetFeedback = async () => {
    if (!isFormValid) {
      setError("Write every part first.");
      return;
    }
    await markInputs(activePage, pages[activePage].inputs);
  };

  // Paste mode: split the pasted paragraph into the parts, then (optionally) mark it.
  const handleSplitParagraph = async (markAfter: boolean) => {
    const page = activePage;
    const text = pasted[page].trim();
    if (!text) return;
    const current = partsText(page, pages[page].inputs);
    if (current && current !== text.replace(/\s+/g, " ") && !window.confirm("Replace the text in your parts with the paragraph you pasted?")) {
      return;
    }
    setSplitting(true);
    setSplitError(null);
    setError(null);
    try {
      const sections = await splitText({ scope: "paragraph", section: page, text });
      const parts = sections[page] ?? {};
      const inputs = { ...pages[page].inputs, ...parts } as ParagraphData;
      // Body and counter-argument paragraphs need the thesis: take it from the introduction when it is empty.
      const introThesis = textOf(pages.introduction.inputs, "thesis").trim();
      if (SECTIONS[page].needsThesis && !textOf(inputs, "thesisContext").trim() && introThesis) {
        (inputs as Record<InputField, string>).thesisContext = introThesis;
      }
      updatePage(page, (prev) => ({ ...prev, inputs, coherence: { status: "idle" } }));
      setMode("parts");
      const v = validate(inputs, page);
      const ready = allValid(v);
      const emptyParts = SECTIONS[page].parts.filter((p) => !v[p.field]?.isValid && !v[p.field]?.message).length;
      setSplitNotice(
        ready
          ? markAfter
            ? "Your paragraph was split into its parts, without changing your words. Marking it now."
            : "Your paragraph was split into its parts, without changing your words. Check each part, then mark it."
          : emptyParts > 0
            ? `Your paragraph was split into its parts. ${emptyParts === 1 ? "One part is" : `${emptyParts} parts are`} empty: write ${emptyParts === 1 ? "it" : "them"}, then mark it.`
            : !v.thesisContext || v.thesisContext.isValid
              ? "Your paragraph was split into its parts. Fix the notes in red under your parts, then mark it."
              : "Your paragraph was split into its parts. Add your thesis at the top, then mark it.",
      );
      if (markAfter && ready) await markInputs(page, inputs);
    } catch (e) {
      setSplitError(e instanceof Error ? e.message : "Couldn't split your paragraph. Try again.");
    } finally {
      setSplitting(false);
    }
  };

  const handleModeChange = (next: WriteMode) => {
    setSplitNotice(null);
    setSplitError(null);
    if (next === "paste" && !pasted[activePage].trim()) {
      const current = partsText(activePage, pages[activePage].inputs);
      if (current) setPasted((p) => ({ ...p, [activePage]: current }));
    }
    setMode(next);
  };

  const handleClear = () => {
    if (!window.confirm(`Delete the text in your ${section.noun}? Your other sections stay saved.`)) return;
    updatePage(activePage, () => emptyPage(activePage));
    localStorage.removeItem(STORAGE_KEYS[activePage]);
    setPasted((p) => ({ ...p, [activePage]: "" }));
    setSettings(EMPTY_SETTINGS);
    setError(null);
    setSplitNotice(null);
  };

  const editsFor = (state: PageState) => {
    const edits = (state.feedback?.inlineEdits ?? {}) as Record<string, string | undefined>;
    return Object.fromEntries(
      Object.entries(edits).filter(
        ([field, value]) => field in state.inputs && value?.trim() && value.trim() !== textOf(state.inputs, field as InputField).trim(),
      ),
    ) as Partial<Record<InputField, string>>;
  };
  const pendingEdits = editsFor(activeState);

  const handleApplyAllEdits = () => {
    updatePage(activePage, (prev) => ({ ...prev, inputs: { ...prev.inputs, ...editsFor(prev) } }));
  };

  const handleApplyEdit = (field: InputField) => {
    const edit = pendingEdits[field];
    if (edit) handleInputChange(field, edit);
  };

  const handlePageChange = useCallback((page: PageType) => {
    setError(null);
    setSplitNotice(null);
    setSplitError(null);
    setEssayOpen(false);
    setActivePage(page);
    window.scrollTo({ top: 0 });
  }, []);

  const handleOpenEssay = useCallback(() => {
    setError(null);
    setSplitNotice(null);
    setSplitError(null);
    setEssayOpen(true);
    window.scrollTo({ top: 0 });
  }, []);

  // Full essay: split it into the five sections and their parts.
  const handleSplitEssay = async () => {
    const text = pasted.essay.trim();
    if (!text) return;
    const hasText = SECTION_ORDER.some((page) => partsText(page, pages[page].inputs));
    if (hasText && !window.confirm("Replace the text in your five sections with the essay you pasted?")) return;
    setSplitting(true);
    setSplitError(null);
    setSplitNotice(null);
    setMarkAllError(null);
    try {
      const sections = await splitText({ scope: "essay", text });
      setPages((prev) => {
        const next = { ...prev };
        for (const page of SECTION_ORDER) {
          next[page] = { ...emptyPage(page), inputs: { ...EMPTY_INPUTS[page], ...(sections[page] ?? {}) } as ParagraphData };
        }
        return next;
      });
      setSplitNotice("Your essay was split into its five sections and their parts, without changing your words.");
      requestAnimationFrame(() => document.getElementById("essay-sections")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setSplitError(e instanceof Error ? e.message : "Couldn't split your essay. Try again.");
    } finally {
      setSplitting(false);
    }
  };

  // Full essay: mark every section that is ready, all at once.
  const handleMarkAll = async () => {
    const ready = SECTION_ORDER.filter((page) => allValid(validate(pages[page].inputs, page)));
    if (ready.length === 0) return;
    setMarkAllError(null);
    setMarkingPages(ready);
    const results = await Promise.allSettled(
      ready.map(async (page) => {
        const marked = pages[page].inputs;
        const response = await getFeedback({ ...marked, ...settings });
        updatePage(page, (prev) => ({ ...prev, feedback: response, markedInputs: marked }));
        setMarkingPages((list) => list.filter((p) => p !== page));
      }),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setMarkingPages([]);
    if (failed) setMarkAllError(`${failed} ${failed === 1 ? "section" : "sections"} could not be marked. Check your connection and try again.`);
  };

  const statuses = useMemo(
    () =>
      Object.fromEntries(
        SECTION_ORDER.map((page) => [
          page,
          {
            started: fieldsOf(pages[page].inputs).some((f) => textOf(pages[page].inputs, f).trim()),
            points: pages[page].feedback?.officialGrade?.points ?? null,
          },
        ]),
      ) as Record<PageType, SectionStatus>,
    [pages],
  );

  const summaries: SectionSummary[] = useMemo(
    () =>
      SECTION_ORDER.map((page) => {
        const state = pages[page];
        const v = validate(state.inputs, page);
        const fresh = !!state.markedInputs && sameInputs(state.markedInputs, state.inputs);
        return {
          id: page,
          title: SECTIONS[page].title,
          words: countWords(partsText(page, state.inputs)),
          started: !!partsText(page, state.inputs),
          ready: allValid(v),
          issues: (Object.values(v) as (ValidationState | undefined)[]).filter((s) => !s?.isValid).length,
          grade: fresh ? state.feedback?.officialGrade ?? null : null,
          marking: markingPages.includes(page),
        };
      }),
    [pages, markingPages],
  );

  const grade = activeState.feedback?.officialGrade;
  const stale = !!activeState.markedInputs && !sameInputs(activeState.markedInputs, activeState.inputs);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-sm bg-[var(--ink)] px-3 py-1 text-[var(--paper)] focus:not-sr-only focus:absolute focus:left-2 focus:top-2"
      >
        Skip to your writing
      </a>
      <Header activePage={essayOpen ? null : activePage} onPageChange={handlePageChange} statuses={statuses} onEssay={handleOpenEssay} />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 pb-10 sm:px-6">
        {essayOpen ? (
          <>
            <header className="-mt-2 max-w-3xl">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" key="essay">
                Paste your essay.{" "}
                <span className="hl hl-swipe" data-role="reasoning" style={{ "--delay": "200ms" } as CSSProperties}>
                  Get it marked.
                </span>
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                Your whole essay is split into its five sections and their parts. Then mark all five at once, or open one section to
                work on it.
              </p>
            </header>
            <EssaySheet
              essayText={pasted.essay}
              onEssayChange={(text) => {
                setSplitNotice(null);
                setPasted((p) => ({ ...p, essay: text }));
              }}
              onSplit={handleSplitEssay}
              splitting={splitting}
              splitError={splitError}
              splitNotice={splitNotice}
              summaries={summaries}
              onOpenSection={handlePageChange}
              onMarkAll={handleMarkAll}
              markingAll={markingPages.length > 0}
              markAllError={markAllError}
              onClear={() => {
                if (!window.confirm("Delete the essay you pasted? Your five sections stay as they are.")) return;
                setPasted((p) => ({ ...p, essay: "" }));
                setSplitNotice(null);
              }}
            />
          </>
        ) : (
          <>
            <header className="-mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0 max-w-3xl">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" key={activePage}>
                  Write your {section.noun}.{" "}
                  <span className="hl hl-swipe" data-role="reasoning" style={{ "--delay": "200ms" } as CSSProperties}>
                    Get it marked.
                  </span>
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  {NUMBER_WORDS[section.parts.length]} parts, one paragraph:{" "}
                  {section.parts.map((p, i) => (
                    <span key={p.field}>
                      <span data-role={p.role} className="hl text-[var(--ink)]">
                        {p.label.toLowerCase()}
                      </span>
                      {i < section.parts.length - 1 ? ", " : ". "}
                    </span>
                  ))}
                  Worth <span className="nums text-[var(--ink)]">{formatPoints(section.points)}</span> of 5 points on Diego's essay rubric.
                </p>
              </div>
              {grade && (
                <button
                  type="button"
                  onClick={scrollToReport}
                  className="group flex items-center gap-4 pr-3 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  <span className="text-right leading-tight">
                    Last marking
                    <span className="block text-xs text-[var(--ink-faint)] group-hover:underline">
                      {grade.level} · see notes
                    </span>
                  </span>
                  <span className="nums text-[var(--pen)]">
                    <span className="text-2xl font-semibold">{formatPoints(grade.points)}</span>
                    <span className="text-xs">/{formatPoints(grade.maxPoints)}</span>
                  </span>
                </button>
              )}
            </header>

            <WritingSheet
              section={section}
              inputs={activeState.inputs}
              counts={counts}
              validation={validation}
              onInputChange={handleInputChange}
              mode={mode}
              onModeChange={handleModeChange}
              canMark={isFormValid}
              isMarking={isLoading || markingPages.includes(activePage)}
              markError={error}
              onMark={handleGetFeedback}
              coherence={activeState.coherence}
              onCheckCoherence={handleCoherenceCheck}
              onClear={handleClear}
              feedback={activeState.feedback}
              onApplyEdit={handleApplyEdit}
              introThesis={textOf(pages.introduction.inputs, "thesis")}
              marked={grade && !stale ? { points: grade.points, maxPoints: grade.maxPoints } : null}
              onSeeMarking={scrollToReport}
              hideBar={reportVisible && !!activeState.feedback}
              pasted={pasted[activePage]}
              onPastedChange={(text) => setPasted((p) => ({ ...p, [activePage]: text }))}
              onSplit={() => handleSplitParagraph(false)}
              onMarkPasted={() => handleSplitParagraph(true)}
              splitting={splitting}
              splitError={splitError}
              splitNotice={splitNotice}
            />

            <div ref={reportRef} className="scroll-mt-6">
              {activeState.feedback && activeState.markedInputs && (
                <MarkingReport
                  key={JSON.stringify(activeState.markedInputs)}
                  section={section}
                  feedback={activeState.feedback}
                  markedInputs={activeState.markedInputs}
                  stale={stale}
                  canApplyEdits={Object.keys(pendingEdits).length > 0}
                  onApplyAllEdits={handleApplyAllEdits}
                />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pt-2 pb-32 text-xs leading-relaxed text-[var(--ink-faint)] sm:px-6 lg:pb-10">
        <p>Built by Diego Henao, professor and software developer.</p>
        <p>Universidad Tecnológica de Pereira · Licenciatura en Bilingüismo</p>
      </footer>
    </div>
  );
}

export default App;
