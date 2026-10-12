# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Diego Henao's English students at Universidad Tecnológica de Pereira (Licenciatura en Bilingüismo), at a B1+ level, learning to write argumentative essays. They mostly open the app on their phones, on their own, to draft and revise one paragraph at a time.

## Product Purpose

Teacher Diego is an optional self-study writing coach. Students write each section of an argumentative essay (Introduction, Body 1, Body 2, Counter-argument, Conclusion) in guided parts and get instant feedback: the level Diego's own rubric would give the paragraph, criterion scores, genuine grammar errors, concrete suggestions, and a revised paragraph. Success means students revise and improve their paragraphs before writing the final essay, with feedback close to what Diego would say.

## Positioning

Feedback calibrated to one real teacher. The AI follows Diego Henao's grading calibration guide and essay rubric, validated against essays he graded himself, instead of giving generic writing advice.

## Operating Context

- Optional, voluntary practice: nothing is submitted or graded inside the app. Final essays are handled elsewhere.
- Most sessions happen on a phone.
- Drafts are saved in the student's browser (localStorage) per section; there are no accounts.
- Students write in English; feedback is in English.
- Two actions per paragraph: a quick coherence check and full feedback (full feedback takes about 13–18 seconds).

## Capabilities and Constraints

- Five sections with guided fields:
  - Introduction: Hook, Background, Thesis (with two arguments), Transition.
  - Body 1 and Body 2: Claim, Evidence, Warrant, Conclusion.
  - Counter-argument: Counter-Argument, Rebuttal, Evidence, Warrant, Conclusion.
  - Conclusion: Restatement, Summary, Call to Action / Reflection.
  - Body and counter-argument pages also ask for the student's thesis as read-only context.
- Before feedback, every part must be written and banned meta-phrases ("This essay will...") are flagged. Word limits per part are only a guide and never block marking (Diego's decision, 2026-10-12).
- Students can write part by part, paste a whole paragraph (split into its parts automatically, without changing a word), or paste the whole essay on the "Full essay" page (split into the five sections and their parts, then marked all at once). The split only chooses where each part starts; the text is cut from the student's own sentences.
- Feedback contents: official level and points on Diego's rubric (Introduction 0.7, Body 1.0, Counter-argument 1.0, Conclusion 0.5), a 0–5 criteria table with rationales, a genuine-errors grammar table, suggestions with "Apply All Edits", and a revised paragraph that can be copied.
- Stack: React 19, Vite, Tailwind CSS 4, an Express dev server, Vercel serverless functions, OpenAI (gpt-6-luna).

## Brand Commitments

- Name: "Teacher Diego" (binding).
- Visual world: the marked notebook sheet inherited from Diego's sibling app Response Paragraph (`C:\Dev\response_paragraph`, its DESIGN.md), light theme only. Diego first asked for a "zine" style, then pinned this world with a screenshot of Response Paragraph ("quiero algo así", 2026-10-11); the notebook sheet replaces the zine wording.
- Not binding: interface language and the UTP credit line (the footer currently credits Diego Henao and "Universidad Tecnológica de Pereira | Licenciatura en Bilingüismo").

## Evidence on Hand

- Diego's grading calibration guide (`lib/gradingGuide.ts`) and rubric levels.
- No testimonials, usage statistics, or student quotes exist; do not fabricate them.
- Diego's graded student essays live outside this repo and contain personal data; they must never appear in the app or the repository.

## Product Principles

1. Sound like Diego, not a machine: short, warm, direct feedback.
2. One paragraph at a time: the guided structure is how the essay is taught.
3. Phone first: every task must work comfortably on a small touch screen.
4. Practice, not judgment: the level is a guide for revising, never a verdict.
5. Honest feedback: only genuine problems, no invented praise or errors.

## Accessibility & Inclusion

Readers are B1+ English learners: interface copy should be plain and simple. Mostly touch use on phones.
