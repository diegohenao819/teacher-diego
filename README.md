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
2. Set `OPENAI_API_KEY` in `.env` to your OpenAI API key. Optionally set `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT` (`low` by default), `OPENAI_PROMPT_CACHE_RETENTION` (`24h` by default, or `in_memory` for stricter data-retention needs), and `API_PORT` (`3002` by default).
3. Run the app:
   `npm run dev`
