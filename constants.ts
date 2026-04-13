import { BodyParagraphInput, CounterArgumentParagraphInput, Settings, FeedbackResponse, InputField, IntroductionParagraphInput, ConclusionParagraphInput } from './types';

export const WORD_LIMITS: Record<InputField, { min: number; max: number }> = {
  // Introduction
  hook: { min: 10, max: 100 },
  background: { min: 20, max: 120 },
  thesis: { min: 15, max: 80 },
  transition: { min: 5, max: 80 },
  // Body Paragraph
  thesisContext: { min: 15, max: 80 },
  claim: { min: 10, max: 90 },
  evidence: { min: 20, max: 100 },
  warrant: { min: 20, max: 200 },
  conclusion: { min: 10, max: 80 },
  // Counter-Argument Paragraph
  counterArgument: { min: 10, max: 55 },
  rebuttal: { min: 10, max: 90 },
  // Conclusion Paragraph
  restatement: { min: 15, max: 80 },
  summary: { min: 30, max: 100 },
  callToAction: { min: 15, max: 80 },
};

export const BANNED_PHRASES_REGEX = /\b(this essay (will|shows?)|in the following paragraphs|I think that|in my opinion)\b/i;

export const MOCK_FEEDBACK_RESPONSE: FeedbackResponse = {
    rubric: [
        { criterion: "Clarity of Claim", score: 5, rationale: "The claim is clear, debatable, and concise." },
        { criterion: "Logical Link (Evidence→Warrant)", score: 4, rationale: "The warrant connects the evidence to the claim well, but could be slightly more explicit." },
        { criterion: "Evidence Quality", score: 5, rationale: "The evidence is specific and relevant, citing a study." },
        { criterion: "Coherence & Flow", score: 4, rationale: "The paragraph flows well, with good use of connectors." },
        { criterion: "Language Control", score: 5, rationale: "Grammar and vocabulary are appropriate and error-free." }
    ],
    suggestions: [
        "In the warrant, you could explicitly state 'This reduction in stress directly translates to...' for a stronger link.",
        "The conclusion is strong. Consider starting with 'In conclusion,' for more formal writing."
    ],
    inlineEdits: {
        claim: "Implementing a four-day work week boosts both employee productivity and well-being.",
        evidence: "A recent UK study of companies that trialed a four-day week found that 71% of employees reported lower burnout and 39% were less stressed, while company revenue remained stable.",
        warrant: "This reduction in stress and burnout means employees are more focused and motivated during work hours, which directly translates to higher quality work and greater efficiency.",
        conclusion: "In conclusion, adopting a shorter work week is a viable strategy for companies to enhance their workforce's health and maintain strong business performance."
    },
    rewrittenParagraph: "Implementing a four-day work week boosts both employee productivity and well-being. A recent UK study of companies that trialed a four-day week found that 71% of employees reported lower burnout and 39% were less stressed, while company revenue remained stable. This reduction in stress and burnout means employees are more focused and motivated during work hours, which directly translates to higher quality work and greater efficiency. In conclusion, adopting a shorter work week is a viable strategy for companies to enhance their workforce's health and maintain strong business performance.",
    warnings: [],
    grammarAnalysis: [
        { error: "company revenue remain stable", correction: "company revenue remained stable", explanation: "The past tense 'remained' is needed to be consistent with the past context of the study." },
        { error: "translates to higher quality work", correction: "translates into higher quality work", explanation: "'Translates into' is the more idiomatic preposition to use when indicating a result or outcome." }
    ]
};

export const EMPTY_INTRODUCTION_INPUT: IntroductionParagraphInput = {
  hook: '',
  background: '',
  thesis: '',
  transition: '',
};

export const EMPTY_BODY_INPUT: BodyParagraphInput = {
  thesisContext: '',
  claim: '',
  evidence: '',
  warrant: '',
  conclusion: '',
};

export const EMPTY_COUNTER_ARGUMENT_INPUT: CounterArgumentParagraphInput = {
  thesisContext: '',
  counterArgument: '',
  rebuttal: '',
  evidence: '',
  warrant: '',
  conclusion: '',
};

export const EMPTY_CONCLUSION_INPUT: ConclusionParagraphInput = {
    restatement: '',
    summary: '',
    callToAction: '',
};

export const EMPTY_SETTINGS: Settings = {
  stance: undefined,
  topicTag: '',
};