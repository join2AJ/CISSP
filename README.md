# The CISSP Reader

A personal, book-like study site for the ISC2 CISSP exam, written against the
**CISSP Exam Outline effective 15 April 2024** (in force until 14 April 2027).
Target sit: 9–12 February 2027; last possible date 18 February 2027.

## What's inside

- **Eight long-form chapters**, one per domain. Each has an opening essay, every
  outline objective explained, callouts (*Exam lens*, *Think like a manager*,
  *Memory hook*, *Common trap*, *Latest 2024–2026*), a *Memorise* card,
  Sybex chapter references and CISSP-style questions with explanations.
- **Study plan**: the 13-week calendar with tick-off tasks and three
  self-checking checkpoints (23 Dec, 20 Jan, 5 Feb).
- **Practice**: all questions, filterable by domain; misses go to the error log in one click.
- **Tracker**: domain scores with colour bands (85%+ green, 65–84% orange,
  below 65% red), weighted readiness, mock exams, and an error log with
  reason analysis. Export/import JSON to move between devices.
- **What's new 2024–2026**, **Exam tactics**, and **Resources** (including the
  ISC2 *Ultimate Guide to the CISSP* PDF in `resources/`).
- Reading comfort: paper, sepia and night themes; text size; serif or sans;
  reading progress bar; search (press `/` or `Ctrl/⌘ K`).

Progress is stored in the browser's `localStorage` on each device.

## Structure

```
index.html              page shell
assets/css/style.css    all styles
assets/js/content-1.js  Domains 1–4
assets/js/content-2.js  Domains 5–8
assets/js/pages.js      plan, tactics, what's new, resources
assets/js/app.js        router, rendering, progress, search, tracker
resources/              reference PDFs
netlify.toml            Netlify config (static, no build)
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Deploy to Netlify

No build step. In Netlify, *Add new site → Import from Git*, pick this repo,
leave the build command empty and set the publish directory to `.`
(`netlify.toml` already does this). Or drag the folder onto
https://app.netlify.com/drop.

## Editing content

Each domain is a plain JavaScript object in `content-1.js` / `content-2.js`:
`sections[].body` is HTML, `memorise` is a list of strings, and `questions`
have `options`, a zero-based `answer`, and `why`.

*Not affiliated with ISC2. CISSP is a registered mark of ISC2, Inc.*
