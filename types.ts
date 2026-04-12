export type PageType = 'introduction' | 'body' | 'counterArgument' | 'conclusion';

export type Stance = "pro" | "con" | "neutral";

export interface IntroductionParagraphInput {
  hook: string;
  background: string;
  thesis: string;
  transition: string;
}

export interface BodyParagraphInput {
  thesisContext: string;
  claim: string;
  evidence: string;
  warrant: string;
  conclusion: string;
}

export interface CounterArgumentParagraphInput {
  thesisContext: string;
  counterArgument: string;
  rebuttal: string;
  evidence: string;
  warrant: string;
  conclusion: string;
}

export interface ConclusionParagraphInput {
    restatement: string;
    summary: string;
    callToAction: string;
}

export type ParagraphData = IntroductionParagraphInput | BodyParagraphInput | CounterArgumentParagraphInput | ConclusionParagraphInput;

export type IntroductionInputField = keyof IntroductionParagraphInput;
export type BodyInputField = keyof BodyParagraphInput;
export type CounterArgumentInputField = keyof CounterArgumentParagraphInput;
export type ConclusionInputField = keyof ConclusionParagraphInput;
export type InputField = IntroductionInputField | BodyInputField | CounterArgumentInputField | ConclusionInputField;


export interface Settings {
    stance?: Stance;
    topicTag?: string;
}

export type IntroductionRubricCriterion = "Hook Effectiveness" | "Background Clarity" | "Thesis Precision & Two-Reason Structure" | "Transition Quality & Flow Signaling" | "Language Control";
export type BodyRubricCriterion = "Clarity of Claim" | "Logical Link (Evidence→Warrant)" | "Coherence & Flow" | "Evidence Quality" | "Language Control";
export type CounterArgumentRubricCriterion = "Clarity of Counter-Argument" | "Strength of Rebuttal" | "Evidence Quality" | "Rebuttal→Warrant Link" | "Language Control";
export type ConclusionRubricCriterion = "Thesis Restatement" | "Synthesis of Arguments + Counter-Argument/Rebuttal" | "Closing Move (Call to Action/Reflection impact)" | "Language Control";

export interface RubricCriterion {
  criterion: IntroductionRubricCriterion | BodyRubricCriterion | CounterArgumentRubricCriterion | ConclusionRubricCriterion;
  score: 0 | 1 | 2 | 3 | 4 | 5;
  rationale: string;
}

export interface GrammarAnalysis {
  error: string;
  correction: string;
  explanation: string;
}

export interface FeedbackResponse {
  rubric: RubricCriterion[];
  suggestions: string[];
  inlineEdits: Partial<ParagraphData>;
  rewrittenParagraph: string;
  warnings?: string[];
  grammarAnalysis?: GrammarAnalysis[];
}

export interface ValidationState {
    isValid: boolean;
    message?: string;
}

export type ValidationResult<T extends object> = Record<keyof T, ValidationState>;

export interface CoherenceResponse {
    isCoherent: boolean;
    reason: string;
}

export type CoherenceStatus = {
    status: 'idle' | 'checking' | 'success' | 'error';
    message?: string;
};