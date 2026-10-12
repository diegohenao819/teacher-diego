import cors from "cors";
import express from "express";
import type { ParagraphData, Settings } from "../types.js";
import {
  chatCompletion,
  getOpenAIConfigError,
  OPENAI_MODEL,
} from "../lib/openai.js";
import {
  buildCoherencePrompt,
  buildFeedbackPrompts,
  COHERENCE_SYSTEM_PROMPT,
  normalizeFeedback,
} from "../lib/prompts.js";
import { parseSplitRequest, splitWriting } from "../lib/split.js";

const app = express();
app.use(cors());
app.use(express.json());

// --- OpenAI config ---

const configError = getOpenAIConfigError();
if (configError) {
  console.error(configError);
  process.exit(1);
}

// --- Routes ---

app.post("/api/coherence", async (req, res) => {
  const data: ParagraphData = req.body;
  const prompt = buildCoherencePrompt(data);
  if (!prompt) {
    res.status(400).json({ error: "Unknown paragraph type" });
    return;
  }

  try {
    const text = await chatCompletion(COHERENCE_SYSTEM_PROMPT, prompt, 0.1);
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Coherence check error:", error);
    res.status(500).json({ error: "Failed to check coherence" });
  }
});

app.post("/api/feedback", async (req, res) => {
  const data: ParagraphData & Settings = req.body;
  const prompts = buildFeedbackPrompts(data);
  if (!prompts) {
    res.status(400).json({ error: "Unknown paragraph type" });
    return;
  }

  try {
    const text = await chatCompletion(prompts.system, prompts.user, 0.3);
    const parsed = JSON.parse(text);
    if (!parsed.rubric || !parsed.rewrittenParagraph) {
      res.status(500).json({ error: "Invalid JSON structure from API" });
      return;
    }
    res.json(normalizeFeedback(parsed, prompts.kind));
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: "Failed to get feedback from AI" });
  }
});

app.post("/api/split", async (req, res) => {
  const request = parseSplitRequest(req.body);
  if ("error" in request) {
    res.status(400).json({ error: request.error });
    return;
  }

  try {
    res.json(await splitWriting(request.target, request.text));
  } catch (error) {
    console.error("Split error:", error);
    res.status(500).json({ error: "Failed to split the text" });
  }
});

const PORT = Number(process.env.API_PORT || process.env.PORT || 3002);
const server = app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Using model: ${OPENAI_MODEL} via OpenAI Responses API`);
});

server.on("error", (error) => {
  console.error("Proxy server failed to start:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
