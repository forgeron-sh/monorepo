---
name: quill-setup
description: Onboard Quill to a company or project, or refresh it: read its sources, interview its people, and write the .quill/ context every piece is written from.
disable-model-invocation: true
---

# Quill setup

Quill writes every piece from four context files in the project's `.quill/` folder. This skill writes them: `company.md` (the facts we may state, each with its source), `audience.md` (who reads us), `voice.md` (how we sound), `publishing.md` (where each format goes and how it is checked). Their skeletons are in [`templates/`](templates/).

The context is a **source of truth**: a fact lives in it once, with where it comes from, and every piece is checked against it. Write what the sources and the people say, never what sounds plausible.

## 1. Read what exists

Read, in this order, and note what each source says about the company, its readers, its voice and its publishing:

1. `.quill/` itself. When it exists, this run is a **refresh**: every later step works only on gaps, stale facts and what the person asks to change.
2. The project's front door: `README.md`, `AGENTS.md` or `CLAUDE.md`, the docs index.
3. The positioning: a white paper, a pitch, the home page, the pricing page.
4. The style sources: a style or tone guide, a design system's copy rules.
5. Three published pieces the team considers its best, and the folder each format publishes to.

Done when every template section is either filled from a named source or listed as a gap.

## 2. Interview

Ask about the gaps only, in rounds of at most five questions, each standing on its own. Use the question tool when there is one. Cover, as needed:

- **Company**: the one line, the bet, what is shipped against what is planned, the offer, what must never be claimed.
- **Readers**: who reads which format, what they already know, what they want from us.
- **Voice**: three pieces (ours or others') the team admires and one it dislikes, and why; words to always use, words to avoid; the tone of a sentence that sounds like us.
- **Publishing**: where each format lives, its front matter, how to preview it, who approves it (customers for a story, legal for a claim).

Done when no section is left as a gap: each is answered, or recorded as "unknown: ask before claiming".

## 3. Write the files

Fill [`templates/`](templates/) into `.quill/`. Every fact carries its source: a path in the repository, a URL, or "interview, <date>". Prefer a pointer to the file that owns a changing fact (a price, a version, a list of projects) over a copy of it: a copy goes stale.

Done when every fact in the four files has a source and every changing fact is a pointer.

## 4. Calibrate the voice

Write one paragraph in the voice on a subject the person knows well, and ask what sounds wrong. Record each correction in `voice.md`, under Calibration, as a before → after pair with the reason. Repeat until a paragraph passes untouched.

Done when one paragraph passes with no correction.

## 5. Hand over

Show the four files, list what stays unknown, and say that `quill` and `quill-review` now read them. Suggest a refresh when the offer, the product or the team's readers change.
