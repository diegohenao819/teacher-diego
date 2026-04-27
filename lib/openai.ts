import "./env.js";
import { createHash } from "node:crypto";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";
const PROMPT_CACHE_RETENTION =
  process.env.OPENAI_PROMPT_CACHE_RETENTION === "in_memory"
    ? "in_memory"
    : "24h";
const REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || "low";

export function getOpenAIConfigError(): string | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    return "OPENAI_API_KEY not configured";
  }

  return null;
}

function extractOutputText(data: any): string {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const parts: string[] = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  const text = parts.join("");
  if (!text) {
    throw new Error("OpenAI response did not include text output");
  }

  return text;
}

function createPromptCacheKey(systemPrompt: string): string {
  const hash = createHash("sha256").update(systemPrompt).digest("hex").slice(0, 16);
  return `teacher-diego:${OPENAI_MODEL}:${hash}`;
}

function supportsReasoningEffort(model: string): boolean {
  return model.startsWith("gpt-5") || /^o\d/.test(model);
}

function logPromptCacheUsage(data: any): void {
  const usage = data.usage;
  if (!usage) {
    return;
  }

  const inputTokens = usage.input_tokens ?? usage.prompt_tokens;
  const cachedTokens =
    usage.input_tokens_details?.cached_tokens ??
    usage.prompt_tokens_details?.cached_tokens ??
    0;

  console.log(
    `OpenAI prompt cache: ${cachedTokens} cached / ${inputTokens ?? "unknown"} input tokens`,
  );
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  _temperature: number,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const configError = getOpenAIConfigError();
  if (!apiKey || configError) {
    throw new Error(configError ?? "OPENAI_API_KEY not configured");
  }

  const requestBody: Record<string, unknown> = {
    model: OPENAI_MODEL,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: { format: { type: "json_object" } },
    prompt_cache_key: createPromptCacheKey(systemPrompt),
    prompt_cache_retention: PROMPT_CACHE_RETENTION,
  };

  if (supportsReasoningEffort(OPENAI_MODEL)) {
    requestBody.reasoning = { effort: REASONING_EFFORT };
  }

  const res = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`OpenAI error ${res.status}:`, body);
    throw new Error(`OpenAI API returned ${res.status}`);
  }

  const data = await res.json();
  logPromptCacheUsage(data);
  return extractOutputText(data);
}
