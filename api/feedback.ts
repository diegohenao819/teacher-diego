import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ParagraphData, Settings } from '../types.js';
import { chatCompletion, getOpenAIConfigError } from '../lib/openai.js';
import { buildFeedbackPrompts, normalizeFeedback } from '../lib/prompts.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configError = getOpenAIConfigError();
  if (configError) {
    return res.status(500).json({ error: configError });
  }

  const data: ParagraphData & Settings = req.body;
  const prompts = buildFeedbackPrompts(data);
  if (!prompts) {
    return res.status(400).json({ error: 'Unknown paragraph type' });
  }

  try {
    const text = await chatCompletion(prompts.system, prompts.user, 0.3);
    const parsed = JSON.parse(text);
    if (!parsed.rubric || !parsed.rewrittenParagraph) {
      return res.status(500).json({ error: 'Invalid JSON structure from API' });
    }
    return res.json(normalizeFeedback(parsed, prompts.kind));
  } catch (error) {
    console.error('Feedback error:', error);
    return res.status(500).json({ error: 'Failed to get feedback from AI' });
  }
}
