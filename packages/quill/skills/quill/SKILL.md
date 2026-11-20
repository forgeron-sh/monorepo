---
name: quill
description: Use when writing a piece to publish — a blog post, an engineering deep dive, a manifesto or essay, a customer story or case study, a research or lab paper, a changelog entry or release note — or when asked to "write about" a feature, a release, a customer or an idea. For editing an existing draft, see quill-review.
---

# Quill

A piece is written from three things: the project's context (`.quill/`), the guide of its format (`formats/`), and material the writer actually holds. The craft rules every format shares are in [`references/craft.md`](references/craft.md).

The leading word is **material**: a fact, a number, a quote, a decision with its reason, a code sample, a before and after. A piece is as long as its material, never longer.

## 1. Load the context

Read every file in the project's `.quill/` folder: `company.md`, `audience.md`, `voice.md` (its Calibration table included), `publishing.md`. When `.quill/` is missing, say that `/quill-setup` creates it, then ask only what this piece needs: the company in one line, the reader, three words for the voice.

Done when you can name the reader, the voice and where the piece will be published.

## 2. Pick the format

| Format           | Choose it for                                                                    |
| ---------------- | -------------------------------------------------------------------------------- |
| `blog-post`      | A product or company story: a launch, a decision, a lesson, an announcement      |
| `deep-dive`      | How something was built or measured, for engineers, with code and numbers        |
| `manifesto`      | What we believe and why: an essay, a position, a white paper's public version    |
| `customer-story` | What a customer changed with us, in their words, with their results              |
| `paper`          | Research or a lab project written up: a question, a method, results, limits      |
| `changelog`      | One change or release: what is new, improved or fixed, for the people it touches |

Read `formats/<format>.md` in full. When the request fits none, use the closest and say which; when the material belongs in another format (a launch that is one line of changelog), say so before writing.

Done when one format is named and its guide is read.

## 3. Gather and gate the material

List the material for this piece, each item with its source: a path in the repository, a URL, a commit, an interview. Facts about the company come from `company.md` or from the file it points to. A claim without a source becomes a `[NEED: what would prove it]` marker; it never becomes a plausible sentence.

Then the **material gate**: count the distinct items a reader could not have guessed. Each section of the outline needs at least one. When the count is short, get more (read the code, the docs, the changelog; ask at most three questions) or plan a shorter piece.

Done when every planned section has material with a source, or the piece has shrunk to fit.

## 4. Brief

Show the person a brief and wait for their go-ahead:

- **Reader**: one row of `audience.md`.
- **Point**: the one sentence the reader should be able to repeat.
- **Why now**: the release, the decision or the event it hangs on.
- **Material**: the list from step 3, `[NEED]` markers included.
- **Out**: what the piece leaves out.
- **Art**: one sentence for its illustration, when the publishing rules give each piece one.
- **Where**: the file from `publishing.md`.

Done when the person approves the brief or changes it.

## 5. Outline

Write the headings first, following the format's structure. Each heading states something; read in order, the headings alone tell the story. Under each, name the material it uses.

Done when the headings read as the argument and every one has material.

## 6. Draft

Write the piece in its file, as a draft (`draft: true` when the format has it), in the voice of `voice.md` and the rules of `references/craft.md`, with none of the bans of [`references/ai-tells.md`](references/ai-tells.md). When the person brought their own text, keep their sentences that already work: change what fails a rule, and say what you changed.

Done when the file is complete and builds, `[NEED]` markers included.

## 7. Review and hand over

Run the `quill-review` skill on the draft, then apply its fixes. Hand over with: the path, how to preview it, the `[NEED]` markers left, and the approvals the piece still needs (a customer, a figure, a legal claim).

Done when the review passes or every open finding is listed for the person.
