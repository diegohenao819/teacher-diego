---
name: Teacher Diego Essay Writing Desk
description: Write each part of your argumentative essay on a squared notebook sheet and get it back marked in Diego's red pen, rubric level circled first.
colors:
  desk: "#e6ebf1"
  paper: "#fdfdfe"
  grid-line: "rgba(31, 78, 121, 0.085)"
  margin-rule: "rgba(214, 69, 65, 0.55)"
  ink: "#1c2533"
  ink-soft: "#4a5568"
  ink-faint: "#6b7686"
  pen: "#c0392b"
  pen-soft: "rgba(192, 57, 43, 0.1)"
  rule: "rgba(28, 37, 51, 0.14)"
  hl-opening: "rgba(250, 212, 40, 0.55)"
  hl-position: "rgba(110, 175, 240, 0.45)"
  hl-support: "rgba(120, 210, 110, 0.45)"
  hl-reasoning: "rgba(255, 166, 77, 0.5)"
  hl-closing: "rgba(190, 150, 240, 0.48)"
  ink-opening: "#6e5300"
  ink-position: "#1f4e79"
  ink-support: "#1e6b2e"
  ink-reasoning: "#8c4108"
  ink-closing: "#6b2fa0"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title-small:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.55
  body-writing:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "28px"
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  body-small:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
  figures:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "tnum"
  score:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, monospace"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  inner: "2px"
  control: "4px"
  sheet: "4px"
  round: "9999px"
spacing:
  grid: "28px"
  sheet-pad: "28px"
  margin-column: "212px"
  margin-text-offset: "236px"
  note-column: "300px"
  note-column-marked: "320px"
  section-gap: "32px"
components:
  button-mark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 24px"
  button-mark-hover:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 14px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-see-marking:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 16px"
  mode-switch-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.inner}"
    padding: "6px 16px"
  writing-area:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-writing}"
    rounded: "{rounded.control}"
    padding: "0 12px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.sheet-pad}"
  priority-number:
    textColor: "{colors.pen}"
    typography: "{typography.figures}"
    rounded: "{rounded.round}"
    size: "24px"
---

# Design System: Teacher Diego Essay Writing Desk

## Overview

**Creative North Star: "The Marked Notebook Sheet"**

This is the same world as Diego's sibling app Response Paragraph, carried over to the five sections of an argumentative essay (introduction, two body paragraphs, counter-argument, conclusion). Each section is written on a sheet of squared paper lying on a pale blue-grey desk. The student writes in ballpoint navy, each part of the paragraph is swiped with the highlighter of the job it does, and the marking comes back in red pen: the rubric level circled first, ticks, half-ticks and crosses beside the criteria, bracketed notes in the margin. The sheet is the interface; a red margin rule divides the margin (word tally, Mark button, coherence check, circled level) from the writing.

Density is classroom-practical: text sits on a 28px grid, helper text runs at 12-14px, and every figure is set in tabular mono so counts and points read like a tally. This build is light only, classroom daylight on white paper: there are no dark tokens and no theme toggle. The world uses no texture, no handwriting fonts and no page curl; its only hand-made gestures are SVG pen strokes and the highlighter swipe.

Deliberate differences from the sibling: the four part highlighters became five and are keyed by part role rather than by paragraph part, so the same colour means the same job across all five sections (the thesis and its restatement are both blue); the marked sheet carries one official rubric level per paragraph (circled points plus a level word) instead of per-part scores; criteria rows gain a half-tick for partial credit; and the phone bottom bar changes its action once the text is marked.

**Key Characteristics:**
- Squared paper sheets (28px grid) with a red vertical margin rule, floating on a flat desk colour.
- Navy ink for all text and primary actions; red pen reserved for marking, points, errors and focus.
- Five role highlighters (opening, position, support, reasoning, closing), each paired with a darker role ink.
- Tabular mono for figures only; unit words stay in the body face.
- Motion that imitates marking: swipes, pen strokes drawn on, notes inked in, staggered.

## Colors

A cool paper-and-ink neutral base with one marking colour (red pen) and a fixed five-colour highlighter code that means "which job this part does in the essay".

### Primary
- **Ballpoint Navy** (ink): body text, headings, the filled Mark button, the mode-switch thumb, outlined buttons and their hover fill. The default voice of the page.

### Secondary
- **Teacher's Red Pen** (pen): circled points and the level word, ticks, half-ticks and crosses, strike-throughs and corrections, numbered priority badges, warnings and out-of-range counts, marked points beside a nav link, the active nav underline, the margin-note bracket, caret colour, focus outline, and the Mark button's hover. Pen-soft (10% red) is available for tinted pen surfaces.

### Tertiary
- **Opening Yellow / Position Blue / Support Green / Reasoning Orange / Closing Lilac** (hl-opening, hl-position, hl-support, hl-reasoning, hl-closing): translucent highlighter swipes behind text belonging to or naming a part of that role, word-tally fill segments and key dots, and the 3px focus halo of a role's writing area.
- **Role inks** (ink-opening, ink-position, ink-support, ink-reasoning, ink-closing): the dark, legible pairing of each highlighter, used for zero-padded part numbers, part keys on margin notes, the "Suggested edit" label, key-dot rings and the writing-area focus border. Support green ink doubles as the "in range" signal (part counts, "Every part in range" / "Ready").

Roles map to parts per section: Hook and Counter-argument are opening; Thesis, Claim, Rebuttal, Restate your thesis and the thesis reminder are position; Background, Evidence and Summarize are support; Warrant is reasoning; Transition, Conclusion and Call to action are closing.

### Neutral
- **Desk** (desk): page background behind the sheets; also the browser theme colour.
- **Paper** (paper): sheet and input fill, the flat criteria band on the marked sheet, the bottom bar, and reversed text on navy.
- **Grid Line** (grid-line): the 1px squared-paper lines.
- **Margin Rule** (margin-rule): the single vertical red rule on sheets, and the minimum-words tick inside each word-tally slot.
- **Ink Soft** (ink-soft): hints, ledes, rubric rationales, inactive nav links.
- **Ink Faint** (ink-faint): placeholders, unit words ("words", "/5"), metadata, quiet text buttons, the course tag, the footer, the in-progress dot.
- **Rule** (rule): the default border colour, hairline dividers, empty word-tally troughs, disabled outlines, scrollbar thumb.

### Named Rules
**The Red Pen Rule.** Red means the teacher touched it: points, corrections, errors, warnings, focus. Never use pen red for decoration, branding or a neutral call to action at rest.

**The Role Highlighter Rule.** Each highlighter belongs to a part role, set by `data-role`, which supplies both `--hl` and `--part-ink`. A role keeps the same colour in every section, and a highlighter only sits behind text that belongs to, or names, a part of its role. The one standing exception is the page title's "Get it marked." swipe (and text selection), which uses reasoning orange, as in the sibling.

**The Role Ink Rule.** Text that names a part is coloured with its role ink, never with the translucent highlighter, which is only ever a background.

## Typography

**Display Font:** Bricolage Grotesque (fallback Atkinson Hyperlegible Next, sans-serif), loaded at 700 and 800
**Body Font:** Atkinson Hyperlegible Next (fallback system-ui, sans-serif), 400, 700 and 400 italic
**Label/Mono Font:** Atkinson Hyperlegible Mono (400, 600), for figures only

**Character:** A characterful grotesque for headings over a body face built for reading accessibility; the mono is a counting face, not a code face.

### Hierarchy
- **Display** (800, 30px rising to 36px from 640px, tight tracking): the page title, "Write your {section}. Get it marked." One per screen.
- **Headline** (700, 30-36px, tight tracking): the marked sheet title, "{Section}, marked".
- **Title** (700, 20px, tight tracking): part names on the writing sheet, the whole-paragraph heading, and the circled level word in pen red. **Title small** (700, 18px) for in-sheet h3s (What to improve, Criteria, Grammar & vocabulary, A cleaner version).
- **Body writing** (400, 17px on a 28px line): everything the student writes or reads back, the marking justification and the cleaner version, sitting on the grid lines. Examples use 15px italic on the same 28px line.
- **Body** (400, 15px, relaxed): the lede under the page title, suggestions in margin notes.
- **Body small** (400, 14px): hints, margin-note text, rubric rationales, nav links.
- **Label** (700, 12px): keys for single items (a part key on a margin note, "Suggested edit", "Example"), in role ink or ink-faint, sentence case.
- **Figures** (mono, tabular): counts, ranges, points. Circled points scale to 48px semibold with the "/max" at 18px; part numbers render zero-padded "01-05"; nav points at 11px semibold.

### Named Rules
**The Tally Rule.** Every count, range and score figure is set in Atkinson Hyperlegible Mono with tabular figures (`.nums`). Unit words around them ("words", "of", "of 5 points") stay in the body face, usually ink-faint.

**The On-Grid Rule.** Writing and read-back text uses a line-height equal to the grid (28px) so lines sit on the squares.

## Layout

A single centred column (max 1152px, 16px gutters, 24px from 640px). The nav sits above the page header; the page header pairs the title and lede on the left with a "Last marking" link (level word, points in pen) on the right once a section is marked. Sheets stack with 32px between them.

The writing sheet and the marked sheet share one geometry from 1024px: a 212px margin column, the red margin rule at 212px, and content starting at 236px. Below 1024px the margin rule moves to 16px, the margin column disappears, and the circled level moves above the heading. From 1280px each part gets a 300px note column (example, then Diego's notes once marked); the marked sheet uses a 320px column for What to improve and Grammar & vocabulary from 1024px. Sheets pad 28px; content right padding grows to 40px on desktop. Parts stack 40px apart. The writing area grows with its text in 28px rows and never scrolls internally. On sections that need the thesis, a dashed thesis box collapses to a single truncated line once valid so the first part stays in view on a phone.

Below 1024px a fixed bottom bar on paper (top hairline, upward shadow, safe-area padding) carries the compact word tally and the Mark button. When the current text has a marking, the button becomes an outlined "See your marking" with the points in pen; the bar slides away (300ms, expo-out) while the marked sheet fills the lower part of the screen. The footer leaves 128px of bottom padding on phones to clear the bar.

## Elevation & Depth

Depth is physical and minimal: sheets lift off the desk with one soft paper shadow, and nothing else floats. Inside a sheet everything is flat; separation comes from hairline rules and the margin rule. The only other shadows are the Mark button (navy at rest, red on hover) and the phone bottom bar's upward shadow.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px rgba(28,37,51,0.06), 0 12px 32px -12px rgba(28,37,51,0.18)`): every sheet.
- **Mark button** (`0 4px 14px -6px rgba(28,37,51,0.45)`, hover `0 10px 22px -10px rgba(192,57,43,0.6)`): the single primary action.
- **Bottom bar** (`0 -8px 24px -12px rgba(0,0,0,0.25)`): the fixed phone action bar.

### Named Rules
**The One Sheet Shadow Rule.** Paper is the only surface with elevation. Boxes inside a sheet stay flat and use rule-colour hairlines or a dashed rule border.

## Shapes

Nearly square. Sheets, buttons, inputs, the mode-switch frame and the thesis box use a 4px corner; the mode-switch thumb and word-tally slots use 2px. Full circles are reserved for numbered priority badges, the word-tally key dots and the in-progress dot. Borders are 1px in the rule colour; the thesis box uses a dashed rule border. Organic shapes come only from the pen: the loose circle around the points, ticks, half-ticks, crosses, the nav underline, the scribble loader and the margin-note bracket, all with round caps. The highlighter swipe has slightly uneven corners (0.2em-0.35em) and a feathered 100deg edge, and clones across line breaks.

## Components

### Buttons
Decisive, ink-on-paper, never pill-shaped.
- **Shape:** near-square corners (4px).
- **Primary (Mark my paragraph):** filled navy, paper text, semibold, 48px tall, 24px horizontal padding (full width at 15px in the margin column). One per screen: in the margin column on desktop, in the bottom bar on phones.
- **Hover / Focus:** lifts 1px and turns pen red with a red shadow (200ms); returns on press. Focus everywhere is a 2px pen-red outline at 2px offset. Disabled drops to 45% opacity with no shadow or lift.
- **Outline (Check coherence, Use all suggested edits, See your marking):** 1px navy border, navy semibold text; fills navy with paper text on hover. Check coherence and Use all edits are 36px tall; See your marking is 48px and carries the points in pen mono. Disabled outlines turn rule-coloured with ink-faint text.
- **Text buttons:** semibold 12-14px in ink-faint that darken to ink on hover (Clear text turns pen red). Actions that apply a change (Use this edit, Use the thesis from your introduction) are ink with a 2px pen-red underline at 4px offset.
- **Loading:** label replaced with a looping red scribble plus "Marking…" or "Checking…".

### Mode Switch
A three-segment tablist (Part by part / Whole paragraph / Paste a paragraph; "Parts / Whole / Paste" on phones) at the top of the writing sheet: 1px rule border, 4px inset, equal segments, a navy thumb that slides between them (300ms, expo-out); active label in paper, inactive in ink-soft. Full width on phones. Paste mode shows one squared writing area and an outlined "Split into parts" button; marking from it splits the paragraph first (verbatim, by sentence), fills the parts, and marks when nothing blocks it.

### Inputs / Fields
- **Style:** the writing area is squared paper itself (grid background scrolling with the text), 1px rule border, 4px corners, 17px text on a 28px line, red caret.
- **Focus:** border takes the role ink and a 3px halo in the role's highlighter; other parts fade to 45% opacity while one is focused, and the focused part's name re-swipes its highlighter.
- **Error:** inline pen-red text below the field; no red borders. Only an empty part, the missing thesis, or a meta-phrase blocks marking. Word ranges are a guide, never a blocker: "N words · aim for min–max" beside the part name, the count in support green when in range and semibold pen red when outside it.

### Navigation
Display-face wordmark "Teacher Diego" (700, 18-20px) with an ink-faint "Argumentative essay" tag (hidden below 420px), then five section links at 14px in ink-soft (short labels on phones), a rule-coloured divider and a "Full essay" link. On phones "Full essay" moves to the wordmark row so the five sections keep one row. Each section link carries its status: marked points in 11px pen mono from md up (a pen-red dot on phones), or an ink-faint dot when in progress. The active link is ink, semibold, with a hand-drawn red underline that draws on.

### Essay Sheet
The full-essay page uses the same sheet and margin column. The margin holds the mono word count, the paragraphs pasted, and the primary "Mark all five sections" ("Mark ready sections" when some are not ready). The content holds one squared writing area for the whole essay with an outlined "Split into sections" button, then "Your five sections": a hairline-divided list with a zero-padded mono number, the section title in the display face, a status line (Not started / Ready to mark in support green / N parts to fix in pen red / Marked), the circled points with the level word once marked, and an "Open" link with a pen-red underline. A closing line gives the content points so far out of 4.2 and notes that grammar and mechanics (0.8) is marked on the whole essay.

### Margin Note
A note tied to its part by a thin red bracket (hooked top and bottom ends, 1.4px). It holds the part key in its role highlighter and ink, then 14px text: corrections as a 2px red strike-through followed by the fix in semibold red, a suggested edit, or a tick with "No edits suggested". Notes ink in from the left with a blur.

### Pen Marks
SVG strokes in pen red with round caps, drawn on with a dash animation (0.6s): the loose circle around the points (2.2px), the tick (5/5), the half-tick (3-4/5; a tick with a short nick across its long arm, never long enough to read as a cross), the cross (0-2/5), the nav underline and the scribble loader. Criteria marks stagger 120ms per row.

### Circled Level
The marked sheet opens with the official rubric level for the whole paragraph: points in 48px semibold pen mono with "/max" smaller, inside the drawn circle, and the level word (e.g. "Excellent") in the display face, 20px bold pen red, beneath it in the margin column on desktop and beside it on phones. A one-paragraph justification inks in after it on the 28px grid.

### Word Tally
Each part gets a slot sized to its maximum words, a rule-coloured 2px-corner trough filled with its role highlighter (500ms, expo-out), with a thin margin-rule tick at its minimum and a pen outline when over. A mono total sits above with a status: "Start writing" (ink-faint), "N parts to write" (pen) while a part is empty, then "Every part in range" or "Ready · N off range" (support green); the phone tally says "Ready". In paste mode the tally is replaced by the count of words pasted. The full tally in the margin adds a per-part key (dot, label, mono count/range); the compact phone tally is an 8px track.

### Sheet
The container for everything: paper fill, 28px grid, 4px corners, the sheet shadow, and optionally the red margin rule. Sections inside a sheet split with a top hairline rather than a nested box.

## Do's and Don'ts

### Do:
- **Do** put every content area on a sheet (paper, 28px grid, 4px corners, the sheet shadow) over the desk colour.
- **Do** keep the margin rule at 212px with content at 236px on any sheet with a margin column, and move it to 16px below 1024px.
- **Do** colour a part by setting `data-role` to its job (opening, position, support, reasoning, closing) and letting it supply both the highlighter and the role ink.
- **Do** set every figure in the mono face with tabular figures, and leave unit words in the body face.
- **Do** lead any marking with one circled rubric level per paragraph, and mark criteria with a tick (5/5), half-tick (3-4/5) or cross (0-2/5).
- **Do** draw marking (circles, ticks, crosses, underlines, brackets) as SVG pen strokes in pen red, drawn on with `pen-draw` and staggered.
- **Do** use expo-out (`cubic-bezier(0.16, 1, 0.3, 1)`) for entrances and swipes, and turn all of it off under reduced motion, leaving pen strokes fully drawn.
- **Do** show corrections as a 2px red strike-through on the wrong text followed by the fix in semibold red.

### Don't:
- **Don't** use pen red at rest for anything that is not marking, an error, focus, or a hover response.
- **Don't** put a role highlighter on text that does not belong to, or name, a part of that role (the page-title swipe is the one exception).
- **Don't** add dark-theme tokens or a theme toggle to this app; it is light only.
- **Don't** add paper texture, handwriting or script fonts, or page-curl effects; the pen exists only in SVG strokes.
- **Don't** nest shadowed cards inside a sheet; separate with rule-colour hairlines.
- **Don't** round controls beyond 4px or use pill buttons.
- **Don't** set small uppercase tracked labels above a heading or section as an eyebrow; the label role is for keying individual items only.
