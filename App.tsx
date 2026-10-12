import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Header, { type SectionStatus } from "./components/Header";
import WritingSheet, { type WriteMode } from "./components/WritingSheet";
import MarkingReport from "./components/MarkingReport";
import {
  BANNED_PHRASES_REGEX,
  EMPTY_BODY_INPUT,
  EMPTY_CONCLUSION_INPUT,
  EMPTY_COUNTER_ARGUMENT_INPUT,
  EMPTY_INTRODUCTION_INPUT,
  EMPTY_SETTINGS,
  WORD_LIMITS,
} from "./constants";
import { checkCoherence, getFeedback } from "./services/openaiService";
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

function loadActivePage(): PageType {
  try {
    const saved = localStorage.getItem(ACTIVE_PAGE_KEY) as PageType | null;
    if (saved && saved in SECTIONS) return saved;
  } catch {
    /* storage unavailable */
  }
  return "introduction";
}

const fieldsOf = (inputs: ParagraphData) => Object.keys(inputs) as InputField[];
const textOf = (inputs: ParagraphData, field: InputField) => (inputs as Record<InputField, string>)[field] ?? "";
const sameInputs = (a: ParagraphData, b: ParagraphData) =>
  fieldsOf(a).every((f) => textOf(a, f).trim() === textOf(b, f).trim());
const formatPoints = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
const NUMBER_WORDS = ["", "One", "Two", "Three", "Four", "Five"];

function App() {
  const [activePage, setActivePage] = useState<PageType>(loadActivePage);
  const [pages, setPages] = useState<Record<PageType, PageState>>(() => ({
    introduction: loadPage("introduction"),
    body: loadPage("body"),
    body2: loadPage("body2"),
    counterArgument: loadPage("counterArgument"),
    conclusion: loadPage("conclusion"),
  }));
  const [mode, setMode] = useState<WriteMode>("parts");
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const scrollToReportNext = useRef(false);
  const [reportVisible, setReportVisible] = useState(false);

  const section = SECTIONS[activePage];
  const activeState = pages[activePage];

  const updatePage = useCallback((page: PageType, update: (prev: PageState) => PageState) => {
    setPages((prev) => ({ ...prev, [page]: update(prev[page]) }));
  }, []);

  // Save each page's inputs as the student writes.
  useEffect(() => {
    for (const page of SECTION_ORDER) {
      localStorage.setItem(STORAGE_KEYS[page], JSON.stringify(pages[page].inputs));
    }
  }, [pages]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PAGE_KEY, activePage);
    } catch {
      /* storage unavailable */
    }
  }, [activePage]);

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
  }, [activeState.feedback, activePage]);

  // After a new marking arrives, bring the circled level into view.
  useEffect(() => {
    if (scrollToReportNext.current && activeState.feedback) {
      scrollToReportNext.current = false;
      requestAnimationFrame(scrollToReport);
    }
  }, [activeState.feedback, scrollToReport]);

  const handleInputChange = useCallback(
    (field: InputField, value: string) => {
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

  const validation = useMemo(() => {
    const result: Partial<Record<InputField, ValidationState>> = {};
    for (const field of fieldsOf(activeState.inputs)) {
      const text = textOf(activeState.inputs, field);
      const wordCount = counts[field] ?? 0;
      const limits = WORD_LIMITS[field];
      if (text.trim().length === 0) {
        result[field] = { isValid: false };
      } else if (wordCount < limits.min || wordCount > limits.max) {
        result[field] = { isValid: false, message: `Must be ${limits.min}-${limits.max} words.` };
      } else if (BANNED_PHRASES_REGEX.test(text)) {
        result[field] = { isValid: false, message: 'Avoid meta-phrases like "This essay will...".' };
      } else if (activePage === "introduction" && field === "thesis" && /\b(multiple|several|many|various) reasons\b/i.test(text)) {
        result[field] = { isValid: false, message: "Be specific; name your two reasons." };
      } else {
        result[field] = { isValid: true };
      }
    }
    return result;
  }, [activeState.inputs, activePage, counts]);

  const isFormValid = useMemo(
    () => (Object.values(validation) as (ValidationState | undefined)[]).every((v) => v?.isValid === true),
    [validation],
  );

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

  const handleGetFeedback = async () => {
    if (!isFormValid) {
      setError("Write every part within its word range first.");
      return;
    }
    const page = activePage;
    const marked = pages[page].inputs;
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

  const handleClear = () => {
    if (!window.confirm(`Delete the text in your ${section.noun}? Your other sections stay saved.`)) return;
    updatePage(activePage, () => emptyPage(activePage));
    localStorage.removeItem(STORAGE_KEYS[activePage]);
    setSettings(EMPTY_SETTINGS);
    setError(null);
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
    setActivePage(page);
    window.scrollTo({ top: 0 });
  }, []);

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
      <Header activePage={activePage} onPageChange={handlePageChange} statuses={statuses} />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 pb-10 sm:px-6">
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
          onModeChange={setMode}
          canMark={isFormValid}
          isMarking={isLoading}
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
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pt-2 pb-32 text-xs leading-relaxed text-[var(--ink-faint)] sm:px-6 lg:pb-10">
        <p>Built by Diego Henao, professor and software developer.</p>
        <p>Universidad Tecnológica de Pereira · Licenciatura en Bilingüismo</p>
      </footer>
    </div>
  );
}

export default App;
