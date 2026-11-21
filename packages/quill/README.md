# @forgeron/quill

A writing framework for agents, as a Claude Code plugin: it learns who you are, then writes and reviews posts, deep dives, manifestos, customer stories, papers and changelog entries the way the best engineering blogs and papers do. Lab project L-10, experimental.

## How it works

1. **`/quill-setup`** (typed by a person) reads the project's sources, interviews its people, and writes the project's context in `.quill/`: `company.md` (the facts we may state, each with its source), `audience.md`, `voice.md` (with a Calibration table of before → after corrections), `publishing.md` (where each format goes).
2. **`quill`** (the agent reaches it when asked to write a piece) loads that context, picks a format, gates the material (no section without a sourced fact; a claim without one becomes `[NEED: …]`), agrees a brief, outlines, drafts in place, and hands over.
3. **`quill-review`** (the agent reaches it when asked to review a draft) classifies the draft (rough, voiced, point edit), runs four passes (facts, structure, lines, title and opening), hands the draft alone to a cold reader, and reports each finding with the passage, the rule and the rewrite.

## Layout

- `skills/quill/SKILL.md`, `skills/quill/formats/<format>.md` (one guide per format), `skills/quill/references/craft.md` (the rules every format shares), `skills/quill/references/ai-tells.md` (the tells of generated prose: what to ban, what to cap, how to fix them without creating new ones, and what to leave alone).
- `skills/quill-review/SKILL.md`.
- `skills/quill-setup/SKILL.md`, `skills/quill-setup/templates/` (the four context files).
- `registry.json`: the skills, the context files and the formats, each format with the sources it was drawn from; typed by `src/index.ts`, checked by `src/registry.test.ts`.
- `.claude-plugin/plugin.json`: the plugin's manifest.

## Use it

- In this repository: the skills are linked into `.claude/skills/`, and Forgeron's context is in `.quill/`.
- Elsewhere: install the plugin from this folder, then run `/quill-setup`.

## Add a format

Write `skills/quill/formats/<id>.md` with at least a `## Structure` and a `## Checklist` (items as `- [ ]`), add a row to the format table of `skills/quill/SKILL.md`, and an entry to `registry.json` with the sources it was drawn from. `bunx vitest run packages/quill` checks the three agree.
