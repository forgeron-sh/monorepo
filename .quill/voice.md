# Forgeron: how we write

## Voice

- **Plain and direct.** Short sentences. One idea per sentence. Second person ("you") when we address the reader, "we" for Forgeron.
- **Concrete.** Real examples over abstractions: a CRM, a contact record, an Odoo gateway, `contacts.search`. Numbers with their unit and their source.
- **Minimal.** If a line does not help someone understand, choose or act, cut it. Short, scannable lines over paragraphs of explanation.
- **Calm.** We state; we do not hype. Superlatives only when measured.

## References

We lean towards **Linear** and **Stripe** (interview, 2026-11-20):

- From Linear: short pieces, titles that are full sentences ("AI coding has made CI a bottleneck, so we reworked ours"), calm confidence, imperative headings, before → after numbers, no hype.
- From Stripe: precision. Long-form when the subject earns it, diagrams for systems, the scale of a problem in its first lines, one idea per section.

## Byline and language

- Every piece is signed **The Forgeron team** (interview, 2026-11-20), deep dives included.
- Everything is published in **English** only.

## The forge register

The forge is our metaphor and we spend it sparingly: "forge" belongs in headlines and in the manifesto ("Forge your internal tools."), never in labels, steps or instructions. A button says "Deploy", not "Forge".

## Vocabulary

Fixed terms, always the same word for the same thing:

| Term         | Meaning                                                 |
| ------------ | ------------------------------------------------------- |
| workspace    | the company, in Forgeron                                |
| tool         | an internal tool (never "app" or "module")              |
| action       | what the SDK defines, `crm.contacts.update`             |
| interface    | MCP, API, Web, CLI                                      |
| version      | an immutable build of a tool                            |
| environment  | Production, Preview                                     |
| access, team | who may do what                                         |
| suite        | the business software a company rents (ERP, CRM suites) |

Developer terms stay as developers say them: commit, branch, preview, build, MCP, API, SSO, SDK. Code, identifiers and versions go in `code`.

## Mechanics

- English for everything published. US spelling except "licence" (the repository's own usage) and proper names.
- Sentence case for titles and headings. No final period in a title.
- No emoji. No exclamation marks.
- Dates as "November 20, 2026" in prose, `2026-11-20` in front matter and file names.
- Numbers: figures for 10 and above and for every measure ("3 ms", "12 tools").
- Links on the words that say where they go, never on "here".

Sources: `docs/design-system.md` (Tone and content), `docs/design-taste.md` (Copy and density).

## Reference paragraph

The paragraph that passed calibration (interview, 2026-11-20). When unsure of the register, read it first:

> Every time someone asks Claude to use one of your tools, the gateway first checks who they are and what they may do. That check used to take several round trips to the database. Since 0.8, it takes one, and the answer is kept until something changes. Calls start sooner, and each one now reports how long every step took, so you can see where the time goes.

The reader's outcome first (calls start sooner, you see where the time goes), the mechanism in plain words second. Internal names (D1, generation, `Server-Timing`) belong in a deep dive or in the notes of a changelog entry, not in the prose of a post.

## Calibration

Before → after pairs from the owner's reactions to rendered pages (`docs/design-taste.md`, Copy and density) and from reviews, with the reason. `quill-review` adds a row when a correction is made twice.

| Before                                                                                                                      | After                                                                                                                                   | Why                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Paragraphs of explanation under every section                                                                               | Short, scannable lines                                                                                                                  | The reader scans before reading.                                                                            |
| Notes that need prose                                                                                                       | Small labelled chunks, one line each                                                                                                    | One idea per line is easier to find again.                                                                  |
| Taglines and captions ("A pixel typeface on a 5-pixel grid")                                                                | Removed                                                                                                                                 | A line that does not help someone choose or act is cut.                                                     |
| Several calls to action                                                                                                     | One, or none                                                                                                                            | One clear next step.                                                                                        |
| Counters and stats as decoration ("35 / 6,121 drawn")                                                                       | Removed                                                                                                                                 | A number earns its place by answering a question.                                                           |
| "The gateway now reads everything a call needs in a single D1 batch, and remembers it until a change bumps its generation." | "That check used to take several round trips to the database. Since 0.8, it takes one, and the answer is kept until something changes." | Too technical for a post: the reader's outcome first, the mechanism in plain words (interview, 2026-11-20). |
| "Four trips: one for the tool, one for its access, one for its teams, one for the person."                                  | "Several round trips."                                                                                                                  | The breakdown was not in the source: a number the material does not give is invented (review, 2026-11-20).  |
