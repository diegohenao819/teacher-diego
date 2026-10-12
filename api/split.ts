import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAIConfigError } from '../lib/openai.js';
import { parseSplitRequest, splitWriting } from '../lib/split.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configError = getOpenAIConfigError();
  if (configError) {
    return res.status(500).json({ error: configError });
  }

  const request = parseSplitRequest(req.body);
  if ('error' in request) {
    return res.status(400).json({ error: request.error });
  }

  try {
    return res.json(await splitWriting(request.target, request.text));
  } catch (error) {
    console.error('Split error:', error);
    return res.status(500).json({ error: 'Failed to split the text' });
  }
}
