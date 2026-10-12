import type { InputField, PageType } from "../types.js";
import { SECTION_ORDER, SECTIONS } from "../sections.js";
import { chatCompletion } from "./openai.js";

// Splits pasted writing into the app's parts. The model only chooses where each part
// starts (by sentence number); the text itself is cut from the student's own sentences,
// so nothing is ever reworded.

export type SplitScope = { scope: "paragraph"; section: PageType } | { scope: "essay" };
export type SplitSections = Partial<Record<PageType, Partial<Record<InputField, string>>>>;

export const MAX_SPLIT_CHARS = 15000;

interface Sentence {
  text: string;
  paragraph: number;
}

interface Slot {
  section: PageType;
  field: InputField;
  label: string;
  hint: string;
}

const SENTENCE_BREAK = /(?<=[.!?…]["”’')\]]*)\s+(?=["“‘'(¿¡]?[A-Z0-9ÁÉÍÓÚÑ])/;

export function splitSentences(text: string): Sentence[] {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p, paragraph) =>
      p
        .split(SENTENCE_BREAK)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ text: s, paragraph })),
    );
}

function slotsFor(target: SplitScope): Slot[] {
  const sections = target.scope === "essay" ? SECTION_ORDER : [target.section];
  return sections.flatMap((id) =>
    SECTIONS[id].parts.map((p) => ({ section: id, field: p.field, label: `${SECTIONS[id].title}: ${p.label}`, hint: p.hint })),
  );
}

// Turns the first-sentence index of each slot into text. Slots without a start stay empty.
function cut(sentences: Sentence[], slots: Slot[], starts: (number | null)[]): SplitSections {
  const result: SplitSections = {};
  slots.forEach((slot, i) => {
    const start = starts[i];
    const end = starts.slice(i + 1).find((v): v is number => v !== null) ?? sentences.length;
    const text = start === null ? "" : sentences.slice(start, end).map((s) => s.text).join(" ");
    (result[slot.section] ??= {})[slot.field] = text;
  });
  return result;
}

function validStarts(raw: unknown, slots: number, sentences: number): (number | null)[] | null {
  if (!Array.isArray(raw) || raw.length !== slots) return null;
  const starts = raw.map((v) => (Number.isInteger(v) ? (v as number) : null));
  const set = starts.filter((v): v is number => v !== null);
  if (set.length === 0 || set[0] !== 0) return null;
  if (set.some((v, i) => v < 0 || v >= sentences || (i > 0 && v <= set[i - 1]))) return null;
  return starts;
}

// Without the model: one paragraph per section when the paragraph count matches,
// then sentences spread over the parts in order.
function fallbackStarts(sentences: Sentence[], slots: Slot[]): (number | null)[] {
  const sectionIds = [...new Set(slots.map((s) => s.section))];
  const paragraphs = [...new Set(sentences.map((s) => s.paragraph))];
  const groups: number[][] =
    sectionIds.length > 1 && paragraphs.length === sectionIds.length
      ? paragraphs.map((p) => sentences.flatMap((s, i) => (s.paragraph === p ? [i] : [])))
      : spread(sentences.map((_, i) => i), sectionIds.length);

  const starts: (number | null)[] = [];
  sectionIds.forEach((id, g) => {
    const parts = slots.filter((s) => s.section === id).length;
    spread(groups[g] ?? [], parts).forEach((chunk) => starts.push(chunk.length ? chunk[0] : null));
  });
  return starts;
}

function spread<T>(items: T[], buckets: number): T[][] {
  const out: T[][] = Array.from({ length: buckets }, () => []);
  if (items.length === 0) return out;
  if (items.length <= buckets) {
    items.forEach((item, i) => out[i].push(item));
    return out;
  }
  items.forEach((item, i) => out[Math.floor((i * buckets) / items.length)].push(item));
  return out;
}

export async function splitWriting(target: SplitScope, text: string): Promise<{ sections: SplitSections; method: "ai" | "fallback" }> {
  const sentences = splitSentences(text);
  const slots = slotsFor(target);

  const system =
    "You split a student's argumentative writing into the parts of Diego Henao's essay structure. You only decide where each part starts; you never rewrite, add, or remove text. Respond only with JSON.";
  const user = `Parts, in order:
${slots.map((s, i) => `${i + 1}. ${s.label} (${s.hint})`).join("\n")}

The student's sentences, numbered, with their paragraph (¶):
${sentences.map((s, i) => `[${i}] (¶${s.paragraph + 1}) ${s.text}`).join("\n")}

Assign every sentence to one part, in order. Parts are contiguous and in the order above; a part may be missing if the student did not write it.${
    target.scope === "essay" ? " Paragraph breaks usually separate the sections, but follow the content when they do not." : ""
  }
Return JSON: { "starts": [ ${slots.length} items: the number of the first sentence of each part, or null if the part is missing ] }. The numbers must strictly increase and the first one must be 0.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const parsed = JSON.parse(await chatCompletion(system, user, 0));
      const starts = validStarts(parsed.starts, slots.length, sentences.length);
      if (starts) return { sections: withThesis(target, cut(sentences, slots, starts)), method: "ai" };
    } catch (error) {
      console.error("Split attempt failed:", error);
    }
  }
  return { sections: withThesis(target, cut(sentences, slots, fallbackStarts(sentences, slots))), method: "fallback" };
}

// For a whole essay, body paragraphs and the counter-argument get the introduction's thesis.
function withThesis(target: SplitScope, sections: SplitSections): SplitSections {
  const thesis = sections.introduction?.thesis;
  if (target.scope !== "essay" || !thesis) return sections;
  for (const id of ["body", "body2", "counterArgument"] as PageType[]) {
    if (sections[id]) sections[id]!.thesisContext = thesis;
  }
  return sections;
}

export function parseSplitRequest(body: any): { target: SplitScope; text: string } | { error: string } {
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return { error: "Paste your text first." };
  if (text.length > MAX_SPLIT_CHARS) return { error: "That text is too long. Paste one essay at a time." };
  if (body.scope === "essay") return { target: { scope: "essay" }, text };
  if (body.scope === "paragraph" && typeof body.section === "string" && body.section in SECTIONS) {
    return { target: { scope: "paragraph", section: body.section as PageType }, text };
  }
  return { error: "Unknown split request." };
}
