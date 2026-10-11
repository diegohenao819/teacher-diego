import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ParagraphData } from '../types.js';
import { chatCompletion, getOpenAIConfigError } from '../lib/openai.js';
import { buildCoherencePrompt, COHERENCE_SYSTEM_PROMPT } from '../lib/prompts.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configError = getOpenAIConfigError();
  if (configError) {
    return res.status(500).json({ error: configError });
  }

  const data: ParagraphData = req.body;
  const prompt = buildCoherencePrompt(data);
  if (!prompt) {
    return res.status(400).json({ error: 'Unknown paragraph type' });
  }

  try {
    const text = await chatCompletion(COHERENCE_SYSTEM_PROMPT, prompt, 0.1);
    return res.json(JSON.parse(text));
  } catch (error) {
    console.error('Coherence check error:', error);
    return res.status(500).json({ error: 'Failed to check coherence' });
  }
}
