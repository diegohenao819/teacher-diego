import { useCallback, useEffect, useMemo, useState } from "react";
// FIX: Import ValidationState to correctly type 'res' in isSyntaxValidForParagraphCheck
import FeedbackPanel from "./components/FeedbackPanel";
import Header from "./components/Header";
import InputForm, { InputConfig } from "./components/InputForm";
import {
  BANNED_PHRASES_REGEX,
  EMPTY_BODY_INPUT,
  EMPTY_CONCLUSION_INPUT,
  EMPTY_COUNTER_ARGUMENT_INPUT,
  EMPTY_INTRODUCTION_INPUT,
  EMPTY_SETTINGS,
  WORD_LIMITS,
} from "./constants";
import { checkCoherence, getFeedback } from "./services/geminiService";
import {
  BodyParagraphInput,
  CoherenceStatus,
  ConclusionParagraphInput,
  CounterArgumentParagraphInput,
  FeedbackResponse,
  InputField,
  IntroductionParagraphInput,
  PageType,
  ParagraphData,
  Settings,
  ValidationResult,
  ValidationState,
} from "./types";

// --- Local Storage Keys ---
const INTRODUCTION_STORAGE_KEY = "teacherDiego_introductionInputs";
const BODY_STORAGE_KEY = "teacherDiego_bodyInputs";
const BODY2_STORAGE_KEY = "teacherDiego_body2Inputs";
const COUNTER_ARGUMENT_STORAGE_KEY = "teacherDiego_counterArgumentInputs";
const CONCLUSION_STORAGE_KEY = "teacherDiego_conclusionInputs";

type PageState<T extends ParagraphData> = {
  inputs: T;
  feedback: FeedbackResponse | null;
  coherence: CoherenceStatus;
};

// FIX: Changed fieldOrder type from `(keyof ParagraphData)[]` to `InputField[]`.
// `keyof ParagraphData` resolves to an intersection of keys ('evidence' | 'warrant' | 'conclusion'),
// which was incorrect. `InputField[]` correctly represents the union of all possible field names.
const PAGE_CONFIGS: Record<
  PageType,
  { fields: InputConfig[]; fieldOrder: InputField[] }
> = {
  introduction: {
    fields: [
      {
        field: "hook",
        label: "1. Hook",
        placeholder:
          "An engaging opener (question, anecdote, statistic). e.g., 'What if the work week could be a day shorter without sacrificing pay?'",
        rows: 3,
      },
      {
        field: "background",
        label: "2. Background",
        placeholder:
          "Briefly provide context. e.g., 'The traditional five-day work week has been the standard for over a century, but modern businesses are starting to question this model.'",
        rows: 4,
      },
      {
        field: "thesis",
        label: "3. Thesis with Two Arguments",
        placeholder:
          "State your stance and two reasons (A & B). e.g., 'Implementing a four-day work week enhances company performance by boosting employee well-being and attracting top talent.'",
        rows: 3,
      },
      {
        field: "transition",
        label: "4. Transition",
        placeholder:
          "Smoothly lead into the body. e.g., 'By examining the benefits for current employees and its appeal to new hires, the advantages of this model become clear.'",
        rows: 2,
      },
    ],
    fieldOrder: ["hook", "background", "thesis", "transition"],
  },
  body: {
    fields: [
      {
        field: "claim",
        label: "1. Claim",
        placeholder:
          "State your main argument. e.g., 'Remote work increases employee productivity.'",
        rows: 3,
      },
      {
        field: "evidence",
        label: "2. Evidence",
        placeholder:
          "Provide a specific fact, example, or reason. e.g., 'A Stanford study found remote workers were 13% more productive.'",
        rows: 5,
      },
      {
        field: "warrant",
        label: "3. Warrant",
        placeholder:
          "Explain how your evidence proves your claim. e.g., 'This productivity gain comes from fewer distractions and more focused work time at home.'",
        rows: 5,
      },
      {
        field: "conclusion",
        label: "4. Conclusion",
        placeholder:
          "Summarize and restate your claim in a new way. e.g., 'Therefore, offering remote options is a key strategy for improving business output.'",
        rows: 3,
      },
    ],
    fieldOrder: ["claim", "evidence", "warrant", "conclusion"],
  },
  body2: {
    fields: [
      {
        field: "claim",
        label: "1. Claim",
        placeholder:
          "State your second main argument. e.g., 'A shorter work week also helps companies attract top talent.'",
        rows: 3,
      },
      {
        field: "evidence",
        label: "2. Evidence",
        placeholder:
          "Provide a specific fact, example, or reason. e.g., 'A Gallup poll found that 54% of workers would switch jobs for one that offers a four-day week.'",
        rows: 5,
      },
      {
        field: "warrant",
        label: "3. Warrant",
        placeholder:
          "Explain how your evidence proves your claim. e.g., 'This willingness to change jobs shows that flexible schedules are a powerful recruitment tool.'",
        rows: 5,
      },
      {
        field: "conclusion",
        label: "4. Conclusion",
        placeholder:
          "Summarize and restate your claim in a new way. e.g., 'Thus, offering a four-day week gives companies a clear edge in the competition for skilled employees.'",
        rows: 3,
      },
    ],
    fieldOrder: ["claim", "evidence", "warrant", "conclusion"],
  },
  counterArgument: {
    fields: [
      {
        field: "counterArgument",
        label: "1. Counter-Argument",
        placeholder:
          "State a reasonable opposing view. e.g., 'Some argue that remote work harms team collaboration.'",
        rows: 3,
      },
      {
        field: "rebuttal",
        label: "2. Rebuttal",
        placeholder:
          "Directly respond to the counter-argument. e.g., 'However, modern tools and structured communication can maintain strong collaboration.'",
        rows: 5,
      },
      {
        field: "evidence",
        label: "3. Evidence",
        placeholder:
          "Provide evidence that supports your rebuttal. e.g., 'A 2022 survey showed 85% of remote teams use dedicated collaboration software daily.'",
        rows: 5,
      },
      {
        field: "warrant",
        label: "4. Warrant",
        placeholder:
          "Explain how your evidence supports the rebuttal and weakens the counter-argument. e.g., 'This reliance on specific tools shows that collaboration has adapted, not disappeared.'",
        rows: 5,
      },
      {
        field: "conclusion",
        label: "5. Conclusion",
        placeholder:
          "Synthesize why your rebuttal is stronger. e.g., 'Thus, while collaboration concerns are valid, they are solvable, making the benefits of remote work outweigh the drawbacks.'",
        rows: 3,
      },
    ],
    fieldOrder: [
      "counterArgument",
      "rebuttal",
      "evidence",
      "warrant",
      "conclusion",
    ],
  },
  conclusion: {
    fields: [
      {
        field: "restatement",
        label: "1. Restate Thesis",
        placeholder:
          "Rephrase your original thesis in a new way. e.g., 'Ultimately, a four-day work week is a strategic move that strengthens a company both internally and in the competitive job market.'",
        rows: 3,
      },
      {
        field: "summary",
        label: "2. Summarize Arguments & Counter",
        placeholder:
          "Recap your points (A, B) and why they outweigh the counter-argument. e.g., 'The model improves staff well-being and recruitment power. While some fear collaboration may suffer, this is manageable and does not negate the core benefits.'",
        rows: 5,
      },
      {
        field: "callToAction",
        label: "3. Call to Action / Reflection",
        placeholder:
          "A final, impactful thought or recommendation. e.g., 'Therefore, business leaders should seriously consider piloting a shorter week to build a more resilient and attractive workplace.'",
        rows: 3,
      },
    ],
    fieldOrder: ["restatement", "summary", "callToAction"],
  },
};

const initialIntroductionState: PageState<IntroductionParagraphInput> = {
  inputs: EMPTY_INTRODUCTION_INPUT,
  feedback: null,
  coherence: { status: "idle" },
};

const initialBodyState: PageState<BodyParagraphInput> = {
  inputs: EMPTY_BODY_INPUT,
  feedback: null,
  coherence: { status: "idle" },
};

const initialBody2State: PageState<BodyParagraphInput> = {
  inputs: EMPTY_BODY_INPUT,
  feedback: null,
  coherence: { status: "idle" },
};

const initialCounterArgumentState: PageState<CounterArgumentParagraphInput> = {
  inputs: EMPTY_COUNTER_ARGUMENT_INPUT,
  feedback: null,
  coherence: { status: "idle" },
};

const initialConclusionState: PageState<ConclusionParagraphInput> = {
  inputs: EMPTY_CONCLUSION_INPUT,
  feedback: null,
  coherence: { status: "idle" },
};

function App() {
  const [activePage, setActivePage] = useState<PageType>("introduction");

  const [introductionState, setIntroductionState] = useState(() => {
    const saved = localStorage.getItem(INTRODUCTION_STORAGE_KEY);
    if (saved) {
      try {
        const parsedInputs = JSON.parse(saved);
        if (
          typeof parsedInputs === "object" &&
          parsedInputs !== null &&
          "thesis" in parsedInputs
        ) {
          return {
            ...initialIntroductionState,
            inputs: { ...EMPTY_INTRODUCTION_INPUT, ...parsedInputs },
          };
        }
      } catch (e) {
        console.error(
          "Failed to parse introduction inputs from localStorage",
          e,
        );
        localStorage.removeItem(INTRODUCTION_STORAGE_KEY);
      }
    }
    return initialIntroductionState;
  });

  const [bodyState, setBodyState] = useState(() => {
    const saved = localStorage.getItem(BODY_STORAGE_KEY);
    if (saved) {
      try {
        const parsedInputs = JSON.parse(saved);
        if (
          typeof parsedInputs === "object" &&
          parsedInputs !== null &&
          "claim" in parsedInputs
        ) {
          return {
            ...initialBodyState,
            inputs: { ...EMPTY_BODY_INPUT, ...parsedInputs },
          };
        }
      } catch (e) {
        console.error("Failed to parse body inputs from localStorage", e);
        localStorage.removeItem(BODY_STORAGE_KEY);
      }
    }
    return initialBodyState;
  });

  const [body2State, setBody2State] = useState(() => {
    const saved = localStorage.getItem(BODY2_STORAGE_KEY);
    if (saved) {
      try {
        const parsedInputs = JSON.parse(saved);
        if (
          typeof parsedInputs === "object" &&
          parsedInputs !== null &&
          "claim" in parsedInputs
        ) {
          return {
            ...initialBody2State,
            inputs: { ...EMPTY_BODY_INPUT, ...parsedInputs },
          };
        }
      } catch (e) {
        console.error("Failed to parse body 2 inputs from localStorage", e);
        localStorage.removeItem(BODY2_STORAGE_KEY);
      }
    }
    return initialBody2State;
  });

  const [counterArgumentState, setCounterArgumentState] = useState(() => {
    const saved = localStorage.getItem(COUNTER_ARGUMENT_STORAGE_KEY);
    if (saved) {
      try {
        const parsedInputs = JSON.parse(saved);
        if (
          typeof parsedInputs === "object" &&
          parsedInputs !== null &&
          "counterArgument" in parsedInputs
        ) {
          return {
            ...initialCounterArgumentState,
            inputs: { ...EMPTY_COUNTER_ARGUMENT_INPUT, ...parsedInputs },
          };
        }
      } catch (e) {
        console.error(
          "Failed to parse counter argument inputs from localStorage",
          e,
        );
        localStorage.removeItem(COUNTER_ARGUMENT_STORAGE_KEY);
      }
    }
    return initialCounterArgumentState;
  });

  const [conclusionState, setConclusionState] = useState(() => {
    const saved = localStorage.getItem(CONCLUSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsedInputs = JSON.parse(saved);
        if (
          typeof parsedInputs === "object" &&
          parsedInputs !== null &&
          "restatement" in parsedInputs
        ) {
          return {
            ...initialConclusionState,
            inputs: { ...EMPTY_CONCLUSION_INPUT, ...parsedInputs },
          };
        }
      } catch (e) {
        console.error("Failed to parse conclusion inputs from localStorage", e);
        localStorage.removeItem(CONCLUSION_STORAGE_KEY);
      }
    }
    return initialConclusionState;
  });

  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageStates = useMemo(
    () => ({
      introduction: {
        state: introductionState,
        setter: setIntroductionState,
        emptyState: initialIntroductionState,
        storageKey: INTRODUCTION_STORAGE_KEY,
      },
      body: {
        state: bodyState,
        setter: setBodyState,
        emptyState: initialBodyState,
        storageKey: BODY_STORAGE_KEY,
      },
      body2: {
        state: body2State,
        setter: setBody2State,
        emptyState: initialBody2State,
        storageKey: BODY2_STORAGE_KEY,
      },
      counterArgument: {
        state: counterArgumentState,
        setter: setCounterArgumentState,
        emptyState: initialCounterArgumentState,
        storageKey: COUNTER_ARGUMENT_STORAGE_KEY,
      },
      conclusion: {
        state: conclusionState,
        setter: setConclusionState,
        emptyState: initialConclusionState,
        storageKey: CONCLUSION_STORAGE_KEY,
      },
    }),
    [introductionState, bodyState, body2State, counterArgumentState, conclusionState],
  );

  const { state: activeState, setter: activeSetter } = pageStates[activePage];

  useEffect(() => {
    localStorage.setItem(
      INTRODUCTION_STORAGE_KEY,
      JSON.stringify(introductionState.inputs),
    );
  }, [introductionState.inputs]);

  useEffect(() => {
    localStorage.setItem(BODY_STORAGE_KEY, JSON.stringify(bodyState.inputs));
  }, [bodyState.inputs]);

  useEffect(() => {
    localStorage.setItem(BODY2_STORAGE_KEY, JSON.stringify(body2State.inputs));
  }, [body2State.inputs]);

  useEffect(() => {
    localStorage.setItem(
      COUNTER_ARGUMENT_STORAGE_KEY,
      JSON.stringify(counterArgumentState.inputs),
    );
  }, [counterArgumentState.inputs]);

  useEffect(() => {
    localStorage.setItem(
      CONCLUSION_STORAGE_KEY,
      JSON.stringify(conclusionState.inputs),
    );
  }, [conclusionState.inputs]);

  const handleInputChange = useCallback(
    (field: InputField, value: string) => {
      activeSetter((prev) => {
        const newInputs = { ...prev.inputs, [field]: value };
        return {
          ...prev,
          inputs: newInputs,
          coherence:
            prev.coherence.status !== "idle"
              ? { status: "idle" }
              : prev.coherence,
        };
      });
    },
    [activeSetter],
  );

  const validationResult = useMemo(() => {
    const inputs = activeState.inputs;
    const fields = Object.keys(inputs) as (keyof typeof inputs)[];

    return fields.reduce(
      (acc, field) => {
        const text = inputs[field];
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        const limits = WORD_LIMITS[field as InputField];

        if (text.trim().length === 0) {
          acc[field] = { isValid: false };
        } else if (wordCount < limits.min || wordCount > limits.max) {
          acc[field] = {
            isValid: false,
            message: `Must be ${limits.min}-${limits.max} words.`,
          };
        } else if (BANNED_PHRASES_REGEX.test(text)) {
          acc[field] = {
            isValid: false,
            message: 'Avoid meta-phrases like "This essay will...".',
          };
        } else if (
          activePage === "introduction" &&
          field === "thesis" &&
          /\b(multiple|several|many|various) reasons\b/i.test(text)
        ) {
          acc[field] = {
            isValid: false,
            message: "Be specific; name your two reasons.",
          };
        } else {
          acc[field] = { isValid: true };
        }
        return acc;
      },
      {} as ValidationResult<typeof inputs>,
    );
  }, [activeState.inputs, activePage]);

  const isSyntaxValidForParagraphCheck = useMemo(() => {
    // FIX: Explicitly type `res` as `ValidationState` because `Object.values` on a union type
    // can lead to `unknown` or `any`, causing a type error when accessing `res.isValid`.
    return Object.values(validationResult).every(
      (res: ValidationState) => res.isValid === true,
    );
  }, [validationResult]);

  const handleCoherenceCheck = useCallback(async () => {
    if (!isSyntaxValidForParagraphCheck) return;
    activeSetter((prev) => ({ ...prev, coherence: { status: "checking" } }));
    try {
      const result = await checkCoherence(activeState.inputs);
      if (result.isCoherent) {
        activeSetter((prev) => ({
          ...prev,
          coherence: { status: "success", message: result.reason },
        }));
      } else {
        activeSetter((prev) => ({
          ...prev,
          coherence: { status: "error", message: result.reason },
        }));
      }
    } catch (e) {
      activeSetter((prev) => ({
        ...prev,
        coherence: {
          status: "error",
          message: "Could not perform coherence check.",
        },
      }));
    }
  }, [activeState.inputs, isSyntaxValidForParagraphCheck, activeSetter]);

  const isFormValid = useMemo(() => {
    return isSyntaxValidForParagraphCheck;
  }, [isSyntaxValidForParagraphCheck]);

  const handleGetFeedback = async () => {
    if (!isFormValid) {
      setError(
        "Please fix the validation errors before submitting.",
      );
      return;
    }
    setIsLoading(true);
    setError(null);
    activeSetter((prev) => ({ ...prev, feedback: null }));
    try {
      const response = await getFeedback({
        ...activeState.inputs,
        ...settings,
      });
      activeSetter((prev) => ({ ...prev, feedback: response }));
    } catch (e) {
      setError("An error occurred while fetching feedback. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    const { setter, emptyState, storageKey } = pageStates[activePage];
    setter(emptyState);
    localStorage.removeItem(storageKey);
    setSettings(EMPTY_SETTINGS);
    setError(null);
    setIsLoading(false);
  };

  const handleApplyEdits = useCallback(() => {
    if (activeState.feedback?.inlineEdits) {
      activeSetter((prev) => ({
        ...prev,
        inputs: { ...prev.inputs, ...activeState.feedback?.inlineEdits },
      }));
    }
  }, [activeState.feedback, activeSetter]);

  const handlePageChange = useCallback((page: PageType) => {
    setError(null);
    setIsLoading(false);
    setActivePage(page);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased flex flex-col">
      <Header
        onNew={handleNew}
        activePage={activePage}
        onPageChange={handlePageChange}
      />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <InputForm
            key={activePage}
            inputs={activeState.inputs}
            onInputChange={handleInputChange}
            onSubmit={handleGetFeedback}
            onCoherenceCheck={handleCoherenceCheck}
            isLoading={isLoading}
            validationResult={validationResult}
            isFormValid={isFormValid}
            isSyntaxValid={isSyntaxValidForParagraphCheck}
            coherence={activeState.coherence}
            config={PAGE_CONFIGS[activePage].fields}
            showThesisContext={
              activePage === "body" ||
              activePage === "body2" ||
              activePage === "counterArgument"
            }
          />
          <FeedbackPanel
            inputs={activeState.inputs}
            feedback={activeState.feedback}
            isLoading={isLoading}
            error={error}
            onApplyEdits={handleApplyEdits}
            fieldOrder={PAGE_CONFIGS[activePage].fieldOrder}
          />
        </div>
      </main>
      <footer className="text-center py-6 px-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
          <p>Built with ❤️ by Diego Henao. Professor & Software Developer</p>
          <p>
            Universidad Tecnológica de Pereira | Licenciatura en Bilingüismo
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
