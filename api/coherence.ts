import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  BodyParagraphInput,
  ConclusionParagraphInput,
  CounterArgumentParagraphInput,
  IntroductionParagraphInput,
  ParagraphData,
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

function buildIntroductionCoherencePrompt(data: IntroductionParagraphInput): string {
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

function buildBodyCoherencePrompt(data: BodyParagraphInput): string {
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

function buildCounterArgumentCoherencePrompt(data: CounterArgumentParagraphInput): string {
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

function buildConclusionCoherencePrompt(data: ConclusionParagraphInput): string {
  return `Analyze the logical coherence of this concluding paragraph.
1. Is the Restatement a faithful rephrasing of a main thesis with two arguments (A & B)?
2. Does the Summary correctly synthesize arguments A & B, and also mention both a counter-argument and a rebuttal?
3. Does the Call to Action/Reflection logically follow from the entire argument without introducing new evidence?

Restatement: "${data.restatement}"
Summary: "${data.summary}"
Call to Action/Reflection: "${data.callToAction}"

Respond with ONLY a JSON object: { "isCoherent": boolean, "reason": "one-sentence explanation" }`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'DASHSCOPE_API_KEY not configured' });
  }

  const data: ParagraphData = req.body;

  let prompt: string;
  if (isIntroductionParagraph(data)) {
    prompt = buildIntroductionCoherencePrompt(data);
  } else if (isBodyParagraph(data)) {
    prompt = buildBodyCoherencePrompt(data);
  } else if (isCounterArgumentParagraph(data)) {
    prompt = buildCounterArgumentCoherencePrompt(data);
  } else if (isConclusionParagraph(data)) {
    prompt = buildConclusionCoherencePrompt(data);
  } else {
    return res.status(400).json({ error: 'Unknown paragraph type' });
  }

  try {
    const systemPrompt = 'You are a logic and reasoning expert helping ESL learners with B2 English level. Your task is to determine if a paragraph is logically coherent. Write your reason in simple, clear language so B2-level students can understand it. Respond only with the requested JSON object.';
    const text = await chatCompletion(systemPrompt, prompt, 0.1);
    return res.json(JSON.parse(text));
  } catch (error) {
    console.error('Coherence check error:', error);
    return res.status(500).json({ error: 'Failed to check coherence' });
  }
}
