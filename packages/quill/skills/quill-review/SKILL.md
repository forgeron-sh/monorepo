---
name: quill-review
description: Use when reviewing, editing, tightening or fact-checking a draft before it is published — a post, a story, a paper, a changelog entry or any prose — or when asked whether a piece is ready, reads well or sounds like us.
---

# Quill review

A review checks a draft against the project's context (`.quill/`), the guide of its format (`../quill/formats/<format>.md`) and the shared craft rules ([`../quill/references/craft.md`](../quill/references/craft.md)). It reports findings first; it rewrites only what the person accepts.

## 1. Load and diagnose

Read the draft, the four files of `.quill/` and the format's guide. Then classify the draft:

- **Rough**: structure or material is missing. Review the brief and the outline before any sentence.
- **Voiced**: the author's voice is there. Protect it: fix what fails a rule, and leave a working sentence as it is, even when you would have written it differently.
- **Point edit**: the person asked about one part. Review that part only.

Done when the draft has one of the three labels.

## 2. Four passes

Run each pass over the whole draft before the next, and note each finding with its line.

1. **Facts.** Every claim about the company traces to `company.md` or the file it points to; every number has its unit, its date and its source; every quote is the person's words, approved. A claim with no source is a finding, marked `[NEED: …]`.
2. **Structure.** The format's structure is followed; the headings alone tell the story; the opening carries the point; the ending gives the reader something to do or to keep.
3. **Lines.** Each rule of `voice.md` and `craft.md`, applied sentence by sentence: vocabulary, sentence length, no-op sentences. Then every pattern of [`ai-tells.md`](../quill/references/ai-tells.md): a ban is a finding on one sighting, two caps in one paragraph make the paragraph a finding. Fix from the facts, and check no fact was lost.
4. **Title and opening.** Read them as a stranger would, from a list of links: do they say what the piece gives?

Done when every rule of the four passes has been applied to every section.

## 3. Cold read

Hand the draft alone (no brief, no notes, no context) to a fresh subagent, and ask it what the piece says, what it could not follow, and what it does not believe. Each answer that differs from the brief's point is a finding.

Done when the cold reader's summary matches the point, or its gaps are findings.

## 4. Report

List the findings, most serious first. For each: the passage quoted, the rule it fails, and the rewrite. Then the format's checklist, item by item, passed or not. Apply the rewrites the person accepts; record a correction they make twice in the Calibration table of `voice.md`.

Done when every finding is fixed, accepted as is, or left open with the person's say.
