import type {
  BodyParagraphInput,
  ConclusionParagraphInput,
  CounterArgumentParagraphInput,
  IntroductionParagraphInput,
  OfficialGrade,
  OfficialLevel,
  ParagraphData,
  Settings,
} from "../types.js";
import { GRADING_GUIDE, STUDENT_LEVEL } from "./gradingGuide.js";

// Shared by the Vercel functions (api/) and the local dev server (server/index.ts)
// so local testing matches production.

export type SectionKind = "introduction" | "body" | "counterArgument" | "conclusion";

// --- Type guards ---

export function isIntroductionParagraph(data: ParagraphData): data is IntroductionParagraphInput {
  return "thesis" in data;
}
export function isBodyParagraph(data: ParagraphData): data is BodyParagraphInput {
  return "claim" in data;
}
export function isCounterArgumentParagraph(data: ParagraphData): data is CounterArgumentParagraphInput {
  return "rebuttal" in data;
}
export function isConclusionParagraph(data: ParagraphData): data is ConclusionParagraphInput {
  return "restatement" in data;
}

// --- Official rubric levels (Diego's essay rubric, one section at a time) ---

export const OFFICIAL_LEVELS: OfficialLevel[] = [
  "Excellent",
  "Good",
  "Satisfactory",
  "Needs Improvement",
  "Poor",
  "Incomplete",
];

const SECTION_LABELS: Record<SectionKind, string> = {
  introduction: "Introduction",
  body: "Body Paragraph",
  counterArgument: "Counter-argument",
  conclusion: "Conclusion",
};

const SECTION_POINTS: Record<SectionKind, Record<OfficialLevel, number>> = {
  introduction: { Excellent: 0.7, Good: 0.56, Satisfactory: 0.42, "Needs Improvement": 0.28, Poor: 0.14, Incomplete: 0 },
  body: { Excellent: 1, Good: 0.8, Satisfactory: 0.6, "Needs Improvement": 0.4, Poor: 0.2, Incomplete: 0 },
  counterArgument: { Excellent: 1, Good: 0.8, Satisfactory: 0.6, "Needs Improvement": 0.4, Poor: 0.2, Incomplete: 0 },
  conclusion: { Excellent: 0.5, Good: 0.4, Satisfactory: 0.3, "Needs Improvement": 0.2, Poor: 0.1, Incomplete: 0 },
};

// Fields the student can edit on each page; "Apply All Edits" may only touch these.
const EDITABLE_FIELDS: Record<SectionKind, string[]> = {
  introduction: ["hook", "background", "thesis", "transition"],
  body: ["claim", "evidence", "warrant", "conclusion"],
  counterArgument: ["counterArgument", "rebuttal", "evidence", "warrant", "conclusion"],
  conclusion: ["restatement", "summary", "callToAction"],
};

const GRAMMAR_ANALYSIS_RULES = `# Grammar Analysis Rules

The grammarAnalysis table lists only genuine errors. A genuine error violates a grammar rule, obscures meaning, or would be marked wrong by a standard style guide (APA, Chicago, MLA). Do NOT list:
- Stylistic preferences (nominalizations vs. gerunds, "capacity" vs. "ability", active vs. passive voice when both are correct)
- Word choice alternatives when the original word is accurate
- Sentence structures that are formal but grammatically sound
- Constructions common in academic writing (appositives, relative clauses with "that/which/where", noun phrases with "its/their")

Verify before correcting. Before listing an error, parse the sentence structure. If the "error" requires rewriting a grammatically valid sentence, it is a preference, not an error. Do not invent fragments, missing objects, or agreement errors that are not actually present. Quote the student's exact words in "error".

When uncertain, favor the student. If there are no genuine errors, return an empty array.`;

function buildFeedbackSystemPrompt(
  kind: SectionKind,
  task: string,
  criteria: string[],
): string {
  const label = SECTION_LABELS[kind];
  const inlineEditKeys = EDITABLE_FIELDS[kind].map((f) => `"${f}"?: string`).join(", ");

  return `You are Diego Henao's writing assistant for his ${STUDENT_LEVEL} English students. You must follow Diego's grading calibration guide exactly, so that your level is the same one Diego would give.

${GRADING_GUIDE}

---

# Your Task: ${label}

${task}

These are the parts the app asks students to write. Use them to guide your suggestions, but decide the official level only with Diego's guide and its calibration notes; a part that does not follow the app's model does not lower the level by itself.

Work in this order:
1. Official level: decide the official rubric level for this ${label} using Diego's guide. Choose exactly one: Excellent, Good, Satisfactory, Needs Improvement, Poor, or Incomplete (only if the paragraph is clearly cut off or unfinished).
2. Criteria: score each criterion from 0 to 5 (integers): ${criteria.join("; ")}. Keep the scores consistent with the official level (Excellent ≈ 5, Good ≈ 4, Satisfactory ≈ 3, Needs Improvement ≈ 2, Poor ≈ 1); individual criteria can be higher or lower. Score Language Control with section 7 of the guide.
3. Feedback, written in Diego's feedback style (section 13 of the guide):
   - officialGrade.justification: one sentence, 10 to 25 words, explaining the level.
   - rubric[].rationale: one sentence, 8 to 20 words.
   - suggestions: 2 to 4 short, concrete, actionable suggestions, most important first.
   - inlineEdits: improved versions of only the parts you changed. Never return empty strings.
   - rewrittenParagraph: one cohesive paragraph combining the parts in order. Fix grammar and clarity, keep the student's stance, ideas, and evidence. Never add new arguments or invented evidence.
   - warnings: short notes about serious problems (for example, a claim that does not match the thesis). Empty array if none.
   - grammarAnalysis: follow the Grammar Analysis Rules below.

Output STRICTLY valid JSON matching this schema:
{
  "officialGrade": { "level": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Poor" | "Incomplete", "justification": string },
  "rubric": [{ "criterion": string, "score": integer, "rationale": string }],
  "suggestions": [string],
  "inlineEdits": { ${inlineEditKeys} },
  "rewrittenParagraph": string,
  "warnings": [string],
  "grammarAnalysis": [{ "error": string, "correction": string, "explanation": string }]
}

${GRAMMAR_ANALYSIS_RULES}`;
}

// --- Introduction ---

const INTRODUCTION_CRITERIA = [
  "Hook Effectiveness",
  "Background Clarity",
  "Thesis Precision & Two-Reason Structure",
  "Transition Quality & First Argument Introduction",
  "Language Control",
];

function buildIntroductionUserPrompt(data: IntroductionParagraphInput & Settings): string {
  return `STANCE: ${data.stance || "unspecified"}
TOPIC TAG: ${data.topicTag || "none"}

HOOK: ${data.hook}
BACKGROUND: ${data.background}
THESIS (with 2 arguments): ${data.thesis}
TRANSITION: ${data.transition}`;
}

// --- Body ---

const BODY_CRITERIA = [
  "Clarity of Claim",
  "Logical Link (Evidence→Warrant)",
  "Evidence Quality",
  "Coherence & Flow",
  "Language Control",
];

function buildBodyUserPrompt(data: BodyParagraphInput & Settings): string {
  return `STANCE: ${data.stance || "unspecified"}
TOPIC TAG: ${data.topicTag || "none"}
STUDENT'S THESIS (read-only context): ${data.thesisContext}

CLAIM: ${data.claim}
EVIDENCE: ${data.evidence}
WARRANT: ${data.warrant}
CONCLUSION: ${data.conclusion}`;
}

// --- Counter-argument ---

const COUNTER_ARGUMENT_CRITERIA = [
  "Clarity of Counter-Argument",
  "Strength of Rebuttal",
  "Evidence Quality",
  "Rebuttal→Warrant Link",
  "Language Control",
];

function buildCounterArgumentUserPrompt(data: CounterArgumentParagraphInput & Settings): string {
  return `STANCE: ${data.stance || "unspecified"}
TOPIC TAG: ${data.topicTag || "none"}
STUDENT'S THESIS (read-only context): ${data.thesisContext}

COUNTER-ARGUMENT: ${data.counterArgument}
REBUTTAL: ${data.rebuttal}
EVIDENCE: ${data.evidence}
WARRANT: ${data.warrant}
CONCLUSION: ${data.conclusion}`;
}

// --- Conclusion ---

const CONCLUSION_CRITERIA = [
  "Thesis Restatement",
  "Synthesis of Arguments + Counter-Argument/Rebuttal",
  "Closing Move (Call to Action/Reflection impact)",
  "Language Control",
];

function buildConclusionUserPrompt(data: ConclusionParagraphInput & Settings): string {
  return `STANCE: ${data.stance || "unspecified"}
TOPIC TAG: ${data.topicTag || "none"}

RESTATEMENT OF THESIS: ${data.restatement}
SUMMARY OF ARGUMENTS (A, B, counter, rebuttal): ${data.summary}
CALL TO ACTION / REFLECTION: ${data.callToAction}`;
}

export function buildFeedbackPrompts(
  data: ParagraphData & Settings,
): { kind: SectionKind; system: string; user: string } | null {
  if (isIntroductionParagraph(data)) {
    return {
      kind: "introduction",
      system: buildFeedbackSystemPrompt(
        "introduction",
        `Evaluate an introductory paragraph written in four parts: Hook, Background, Thesis, Transition.
- The Thesis should have a clear stance and exactly two distinct supporting reasons (Argument A and Argument B), and it should be debatable (not obvious, like "We should respect human rights" or "Kids should study").
- The Transition should lead into the first body paragraph, introducing only the first argument (Argument A).`,
        INTRODUCTION_CRITERIA,
      ),
      user: buildIntroductionUserPrompt(data),
    };
  }
  if (isBodyParagraph(data)) {
    return {
      kind: "body",
      system: buildFeedbackSystemPrompt(
        "body",
        `Evaluate a body paragraph (Body 1 or Body 2) written in four parts: Claim, Evidence, Warrant, Conclusion.
- The student gives their thesis as read-only context. Check that the Claim develops one of the two thesis arguments. Never rewrite the thesis.
- The Warrant must explain WHY the evidence supports the claim, not repeat the evidence.`,
        BODY_CRITERIA,
      ),
      user: buildBodyUserPrompt(data),
    };
  }
  if (isCounterArgumentParagraph(data)) {
    return {
      kind: "counterArgument",
      system: buildFeedbackSystemPrompt(
        "counterArgument",
        `Evaluate a counter-argument paragraph written in five parts: Counter-Argument, Rebuttal, Evidence, Warrant, Conclusion.
- The student gives their thesis as read-only context. Check that the Counter-Argument opposes the thesis and the Rebuttal defends it. Never rewrite the thesis.
- The Rebuttal must directly answer the Counter-Argument.
- The Warrant must explain WHY the rebuttal's evidence defeats the counter-argument.`,
        COUNTER_ARGUMENT_CRITERIA,
      ),
      user: buildCounterArgumentUserPrompt(data),
    };
  }
  if (isConclusionParagraph(data)) {
    return {
      kind: "conclusion",
      system: buildFeedbackSystemPrompt(
        "conclusion",
        `Evaluate a concluding paragraph written in three parts: Restatement, Summary, Call to Action or Reflection.
- The Restatement should rephrase the thesis (stance + arguments A and B) without introducing new ideas.
- The Summary should synthesize arguments A and B and briefly mention the counter-argument and its rebuttal.
- The Call to Action or Reflection should be a logical closing.`,
        CONCLUSION_CRITERIA,
      ),
      user: buildConclusionUserPrompt(data),
    };
  }
  return null;
}

// Replaces the model's points with the official ones and drops inline edits that would
// blank out or invent form fields.
export function normalizeFeedback(parsed: any, kind: SectionKind): any {
  const rawLevel = String(parsed.officialGrade?.level ?? "").trim().toLowerCase();
  const level = OFFICIAL_LEVELS.find((l) => l.toLowerCase() === rawLevel);
  const officialGrade: OfficialGrade | undefined = level && {
    level,
    points: SECTION_POINTS[kind][level],
    maxPoints: SECTION_POINTS[kind].Excellent,
    section: SECTION_LABELS[kind],
    justification: String(parsed.officialGrade?.justification ?? ""),
  };

  const inlineEdits: Record<string, string> = {};
  for (const [field, value] of Object.entries(parsed.inlineEdits ?? {})) {
    if (EDITABLE_FIELDS[kind].includes(field) && typeof value === "string" && value.trim()) {
      inlineEdits[field] = value.trim();
    }
  }

  const { officialGrade: _ignored, ...rest } = parsed;
  return { ...rest, inlineEdits, ...(officialGrade ? { officialGrade } : {}) };
}

// --- Coherence ---

export const COHERENCE_SYSTEM_PROMPT = `You are a logic and reasoning expert helping ESL learners with ${STUDENT_LEVEL} English level. Your task is to determine if a paragraph is logically coherent. Write your reason in simple, clear language so ${STUDENT_LEVEL} students can understand it. Respond only with the requested JSON object.`;

export function buildCoherencePrompt(data: ParagraphData): string | null {
  if (isIntroductionParagraph(data)) {
    return `Analyze the logical coherence of this introductory paragraph.
1. Does the Hook relate to the Thesis?
2. Does the Background provide brief, neutral context for the Thesis?
3. Does the Thesis contain a clear stance and exactly two distinct arguments (A & B)? Also, is the thesis debatable?
4. Does the Transition logically follow the Thesis and introduce only the first argument (Argument A)?

Hook: "${data.hook}"
Background: "${data.background}"
Thesis: "${data.thesis}"
Transition: "${data.transition}"

Respond with ONLY a JSON object: { "isCoherent": boolean, "reason": "one-sentence explanation" }`;
  }
  if (isBodyParagraph(data)) {
    return `Analyze the logical coherence of the entire paragraph constructed from the following components. Do they form a unified, logical argument from start to finish? Specifically, check:
1. Does the Claim directly support one of the arguments in the student's thesis?
2. Does the warrant link the evidence to the claim?
3. Does the conclusion logically follow from the preceding argument?

Student's Thesis: "${data.thesisContext}"
Claim: "${data.claim}"
Evidence: "${data.evidence}"
Warrant: "${data.warrant}"
Conclusion: "${data.conclusion}"

Respond with ONLY a JSON object: { "isCoherent": boolean, "reason": "one-sentence explanation" }`;
  }
  if (isCounterArgumentParagraph(data)) {
    return `Analyze the logical coherence of this counter-argument paragraph. Check:
1. Is the Counter-Argument a genuine opposing view to the student's thesis?
2. Does the Rebuttal directly address the Counter-Argument?
3. Does the Warrant logically connect the Evidence to the Rebuttal?
4. Does the Conclusion synthesize the argument effectively and reinforce the thesis?

Student's Thesis: "${data.thesisContext}"
Counter-Argument: "${data.counterArgument}"
Rebuttal: "${data.rebuttal}"
Evidence: "${data.evidence}"
Warrant: "${data.warrant}"
Conclusion: "${data.conclusion}"

Respond with ONLY a JSON object: { "isCoherent": boolean, "reason": "one-sentence explanation" }`;
  }
  if (isConclusionParagraph(data)) {
    return `Analyze the logical coherence of this concluding paragraph.
1. Is the Restatement a faithful rephrasing of a main thesis with two arguments (A & B)?
2. Does the Summary correctly synthesize arguments A & B, and also mention both a counter-argument and a rebuttal?
3. Does the Call to Action/Reflection logically follow from the entire argument without introducing new evidence?

Restatement: "${data.restatement}"
Summary: "${data.summary}"
Call to Action/Reflection: "${data.callToAction}"

Respond with ONLY a JSON object: { "isCoherent": boolean, "reason": "one-sentence explanation" }`;
  }
  return null;
}
