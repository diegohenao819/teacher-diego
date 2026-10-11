<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1dp9IxQZzUBQ7e3ntMixS5SMr6BlU-oMp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `OPENAI_API_KEY` in `.env` to your OpenAI API key. Optionally set `OPENAI_MODEL` (`gpt-6-luna` by default), `OPENAI_REASONING_EFFORT` (`medium` by default), `OPENAI_PROMPT_CACHE_RETENTION` (`24h` by default, or `in_memory` for stricter data-retention needs), and `API_PORT` (`3002` by default).
3. Run the app:
   `npm run dev`

## Grading

Feedback follows Diego's grading calibration guide (`lib/gradingGuide.ts`, adapted from his essay grader) and gives each paragraph its level on his essay rubric. The prompts shared by the Vercel functions (`api/`) and the local server (`server/index.ts`) live in `lib/prompts.ts`. To grade for a different level, change `STUDENT_LEVEL` in `lib/gradingGuide.ts`.
