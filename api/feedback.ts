import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  BodyParagraphInput,
  ConclusionParagraphInput,
  CounterArgumentParagraphInput,
  IntroductionParagraphInput,
  ParagraphData,
  Settings,
} from '../types';

const API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const MODEL = 'qwen-plus';

async function chatCompletion(systemPrompt: string, userPrompt: string, temperature: number): Promise<string> {
  const res = await fetch(`${DASHSCOPE_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }] },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`DashScope error ${res.status}:`, body);
    throw new Error(`DashScope API returned ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function isIntroductionParagraph(data: ParagraphData): data is IntroductionParagraphInput { return 'thesis' in data; }
function isBodyParagraph(data: ParagraphData): data is BodyParagraphInput { return 'claim' in data; }
function isCounterArgumentParagraph(data: ParagraphData): data is CounterArgumentParagraphInput { return 'rebuttal' in data; }
function isConclusionParagraph(data: ParagraphData): data is ConclusionParagraphInput { return 'restatement' in data; }

const GRADING_CALIBRATION = `
GRADING CALIBRATION FOR B2-LEVEL ARGUMENTATIVE WRITING:
You are evaluating B2-level student writing, not publishable academic prose. Apply these rules:

1. Only flag genuine errors. A genuine error violates a grammar rule, obscures meaning, or would be marked wrong by a standard style guide (APA, Chicago, MLA). Do NOT flag:
   - Stylistic preferences (nominalizations vs. gerunds, "capacity" vs. "ability", active vs. passive voice when both are correct)
   - Word choice alternatives when the original word is accurate
   - Sentence structures that are formal but grammatically sound
   - Constructions common in academic writing (appositives, relative clauses with "that/which/where", noun phrases with "its/their")

2. Verify before correcting. Before flagging an error, parse the sentence structure. If the "error" requires rewriting a grammatically valid sentence, it is a preference, not an error. Do not invent fragments, missing objects, or agreement errors that are not actually present.

3. Score realistically. A 5.0 means the text meets B2 expectations with no genuine errors. It does NOT require native-level polish or publication-ready prose. If a student produces clean, clear, grammatically correct B2 writing that fulfills the task, award 5.0. Reserve deductions for real issues: grammar errors, unclear meaning, task non-completion, or weak argumentation.

4. When uncertain, favor the student. If a construction could be argued either way, treat it as correct.`;

function buildIntroductionSystemPrompt(): string {
  return `You are an academic writing coach for ESL learners with B2 English level. Answer with simple sentences so students can understand your feedback easily. Your task is to evaluate an introductory paragraph (Hook, Background, Thesis, Transition) and provide constructive feedback.
- The Thesis must have a clear stance and **exactly two** distinct supporting reasons (Argument A and Argument B). Also, is the thesis debatable? (A thesis should not be obvious, for instance "We should respect human rights" or "Kids should study" are very obvious thesis statement)
- The Hook should be engaging and relevant.
- The Background must provide neutral context.
- The Transition should smoothly lead into the first body paragraph, introducing only the first argument (Argument A).
- Score the paragraph on a 0-5 scale for each criterion: Hook Effectiveness, Background Clarity, Thesis Precision & Two-Reason Structure, Transition Quality & First Argument Introduction, Language Control.
- Provide a detailed grammar analysis table.
- Never add new content that changes the student's argument; only improve clarity, logic, and grammar.
- Output STRICTLY valid JSON matching this schema:
{
  "rubric": [{ "criterion": string, "score": integer, "rationale": string }],
  "suggestions": [string],
  "inlineEdits": { "hook"?: string, "background"?: string, "thesis"?: string, "transition"?: string },
  "rewrittenParagraph": string,
  "warnings": [string],
  "grammarAnalysis": [{ "error": string, "correction": string, "explanation": string }]
}

${GRADING_CALIBRATION}`;
}

function buildIntroductionUserPrompt(data: IntroductionParagraphInput & Settings): string {
  return `STANCE: ${data.stance || 'unspecified'}
TOPIC TAG: ${data.topicTag || 'none'}

HOOK: ${data.hook}
BACKGROUND: ${data.background}
THESIS (with 2 arguments): ${data.thesis}
TRANSITION: ${data.transition}

Rubric criteria:
1) Hook Effectiveness
2) Background Clarity
3) Thesis Precision & Two-Reason Structure
4) Transition Quality & First Argument Introduction
5) Language Control

Return fields: rubric[], suggestions[], inlineEdits{hook,background,thesis,transition}, rewrittenParagraph, warnings[], grammarAnalysis[].
The rewritten paragraph must be a single, cohesive paragraph combining the parts in order, preserving the student's core ideas. The transition should only introduce the first argument.`;
}

function buildBodySystemPrompt(): string {
  return `You are an academic writing tutor for ESL learner with B2 English level. Answer with simple sentences so students can understand your feedback easily.
Your job: evaluate a Claim–Evidence–Warrant–Conclusion paragraph, score it with a 5-criterion rubric (0–5 each), and return FIXABLE, actionable suggestions.
- The student will provide their thesis statement for context. Use it to check if the Claim aligns with one of the thesis arguments. Do NOT rewrite the thesis — it is read-only context.
- Be concise, concrete, and kind.
- Never add new content that changes the student's argument; only improve clarity, logic, and grammar.
- For "warrant," ensure it explains WHY the evidence supports the claim (no repetition).
- Provide a detailed grammar analysis table with columns for the 'error', 'correction', and 'explanation'.
- Output STRICTLY valid JSON matching this schema:
{
  "rubric": [{ "criterion": string, "score": integer, "rationale": string }],
  "suggestions": [string],
  "inlineEdits": { "claim"?: string, "evidence"?: string, "warrant"?: string, "conclusion"?: string },
  "rewrittenParagraph": string,
  "warnings": [string],
  "grammarAnalysis": [{ "error": string, "correction": string, "explanation": string }]
}

${GRADING_CALIBRATION}`;
}

function buildBodyUserPrompt(data: BodyParagraphInput & Settings): string {
  return `STANCE: ${data.stance || 'unspecified'}
TOPIC TAG: ${data.topicTag || 'none'}
STUDENT'S THESIS: ${data.thesisContext}

CLAIM: ${data.claim}
EVIDENCE: ${data.evidence}
WARRANT: ${data.warrant}
CONCLUSION: ${data.conclusion}

Rubric criteria:
1) Clarity of Claim
2) Logical Link (Evidence→Warrant)
3) Evidence Quality (can be example or reasoning, not only research)
4) Coherence & Flow
5) Language Control

Return fields: rubric[], suggestions[], inlineEdits{claim,evidence,warrant,conclusion}, rewrittenParagraph, warnings[], grammarAnalysis[].
The grammarAnalysis should list specific grammatical errors, their corrections, and explanations for each.
Rewritten paragraph must keep the same stance and reasons.`;
}

function buildCounterArgumentSystemPrompt(): string {
  return `You are an academic writing tutor specializing in argumentative essays for ESL learners with B2 English level. Answer with simple sentences so students can understand your feedback easily.
Your job: evaluate a Counter-Argument paragraph (Counter-Argument -> Rebuttal -> Evidence -> Warrant -> Conclusion). Score it with a 5-criterion rubric (0–5 each), and return FIXABLE, actionable suggestions.
- The student will provide their thesis statement for context. Use it to check if the Counter-Argument opposes the thesis and the Rebuttal defends it. Do NOT rewrite the thesis — it is read-only context.
- Be concise, concrete, and kind.
- The Rebuttal must DIRECTLY address the Counter-Argument.
- The Warrant must explain WHY the rebuttal's evidence defeats the counter-argument.
- Never add new content that changes the student's argument; only improve clarity, logic, and grammar.
- Provide a detailed grammar analysis table.
- Output STRICTLY valid JSON matching this schema:
{
  "rubric": [{ "criterion": string, "score": integer, "rationale": string }],
  "suggestions": [string],
  "inlineEdits": { "counterArgument"?: string, "rebuttal"?: string, "evidence"?: string, "warrant"?: string, "conclusion"?: string },
  "rewrittenParagraph": string,
  "warnings": [string],
  "grammarAnalysis": [{ "error": string, "correction": string, "explanation": string }]
}

${GRADING_CALIBRATION}`;
}

function buildCounterArgumentUserPrompt(data: CounterArgumentParagraphInput & Settings): string {
  return `STANCE: ${data.stance || 'unspecified'}
TOPIC TAG: ${data.topicTag || 'none'}
STUDENT'S THESIS: ${data.thesisContext}

COUNTER-ARGUMENT: ${data.counterArgument}
REBUTTAL: ${data.rebuttal}
EVIDENCE: ${data.evidence}
WARRANT: ${data.warrant}
CONCLUSION: ${data.conclusion}

Rubric criteria:
1) Clarity of Counter-Argument
2) Strength of Rebuttal
3) Evidence Quality
4) Rebuttal→Warrant Link
5) Language Control

Return fields: rubric[], suggestions[], inlineEdits{counterArgument,rebuttal,evidence,warrant,conclusion}, rewrittenParagraph, warnings[], grammarAnalysis[].
The rewritten paragraph must preserve the student's reasoning and structure.`;
}

function buildConclusionSystemPrompt(): string {
  return `You are an academic writing coach for ESL learners with B2 English level. Answer with simple sentences so students can understand your feedback easily. Your task is to evaluate a concluding paragraph (Restatement, Summary, Call to Action) and provide constructive feedback.
- The Restatement must rephrase the original thesis (stance + two arguments A & B) without introducing new ideas.
- The Summary must synthesize arguments A & B, and briefly mention the counter-argument and its rebuttal, showing why the main arguments prevail.
- The Call to Action or Reflection should be a logical, impactful closing.
- Score the paragraph on a 0-5 scale for each criterion: Thesis Restatement, Synthesis of Arguments + Counter-Argument/Rebuttal, Closing Move (Call to Action/Reflection impact), Language Control.
- Provide a detailed grammar analysis table.
- Never add new content that changes the student's argument.
- Output STRICTLY valid JSON matching this schema:
{
  "rubric": [{ "criterion": string, "score": integer, "rationale": string }],
  "suggestions": [string],
  "inlineEdits": { "restatement"?: string, "summary"?: string, "callToAction"?: string },
  "rewrittenParagraph": string,
  "warnings": [string],
  "grammarAnalysis": [{ "error": string, "correction": string, "explanation": string }]
}

${GRADING_CALIBRATION}`;
}

function buildConclusionUserPrompt(data: ConclusionParagraphInput & Settings): string {
  return `STANCE: ${data.stance || 'unspecified'}
TOPIC TAG: ${data.topicTag || 'none'}

RESTATEMENT OF THESIS: ${data.restatement}
SUMMARY OF ARGUMENTS (A, B, counter, rebuttal): ${data.summary}
CALL TO ACTION / REFLECTION: ${data.callToAction}

Rubric criteria:
1) Thesis Restatement (clarity, faithful to A & B)
2) Synthesis of Arguments + Counter-Argument/Rebuttal
3) Closing Move (Call to Action/Reflection impact)
4) Language Control

Return fields: rubric[], suggestions[], inlineEdits{restatement,summary,callToAction}, rewrittenParagraph, warnings[], grammarAnalysis[].
The rewritten paragraph must be a single, cohesive paragraph combining the parts in order, preserving the student's core ideas.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'DASHSCOPE_API_KEY not configured' });
  }

  const data: ParagraphData & Settings = req.body;

  let systemPrompt: string;
  let userPrompt: string;

  if (isIntroductionParagraph(data)) {
    systemPrompt = buildIntroductionSystemPrompt();
    userPrompt = buildIntroductionUserPrompt(data);
  } else if (isBodyParagraph(data)) {
    systemPrompt = buildBodySystemPrompt();
    userPrompt = buildBodyUserPrompt(data);
  } else if (isCounterArgumentParagraph(data)) {
    systemPrompt = buildCounterArgumentSystemPrompt();
    userPrompt = buildCounterArgumentUserPrompt(data);
  } else if (isConclusionParagraph(data)) {
    systemPrompt = buildConclusionSystemPrompt();
    userPrompt = buildConclusionUserPrompt(data);
  } else {
    return res.status(400).json({ error: 'Unknown paragraph type' });
  }

  try {
    const text = await chatCompletion(systemPrompt, userPrompt, 0.3);
    const parsed = JSON.parse(text);
    if (!parsed.rubric || !parsed.rewrittenParagraph) {
      return res.status(500).json({ error: 'Invalid JSON structure from API' });
    }
    return res.json(parsed);
  } catch (error) {
    console.error('Feedback error:', error);
    return res.status(500).json({ error: 'Failed to get feedback from AI' });
  }
}
