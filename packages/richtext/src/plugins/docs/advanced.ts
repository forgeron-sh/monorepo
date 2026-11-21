// The documentation of the advanced content family as data: code highlighting, formulas and
// footnotes. Sizes are measured: each piece bundled alone with rolldown, minified, for a browser,
// then gzipped (highlight.js 11.11.1, lowlight 3.3.0, KaTeX 0.19.1).

import type { PluginDoc } from "./types";

export const advancedDocs: PluginDoc[] = [
  {
    id: "codeHighlight",
    family: "advanced",
    name: "Code highlighting",
    summary:
      "Syntax colours for the code block and a language selector on it. The engine and each grammar load on first use.",
    core: "@forgeron/richtext/plugins/code-highlight",
    editor: "@forgeron/richtext/plugins/editor/code-highlight",
    requires: ["codeBlock"],
    options: [
      {
        name: "highlight (core, createCodeHighlight)",
        type: "(code: string, language: string) => HighlightToken[] | undefined",
        description:
          "Colours the static view (`RichTextView`, `toHtml`, `toTree`). `undefined` leaves a block plain.",
        default: "none: the static view is plain",
      },
      {
        name: "pluginOptions.codeHighlight.languages",
        type: "string[]",
        description: "Language ids the selector offers and the editor colours.",
        default: "all 26 of LANGUAGES",
      },
      {
        name: "pluginOptions.codeHighlight.maxLength",
        type: "number",
        description: "A block longer than this many characters stays plain.",
        default: "20000",
      },
      {
        name: "pluginOptions.codeHighlight.selector",
        type: "boolean",
        description: "Draw the language selector on each block.",
        default: "true",
      },
    ],
    markdown: "```ts\nconst answer: number = 42;\n```",
    notes: [
      "Opt-in: not in `fullCorePlugins` or `fullEditorPlugins`. Add `advancedCorePlugins` and `advancedEditorPlugins`; the code block plugin must be in the list.",
      "The code block keeps its `language` attribute and its Markdown fence. The plugin owns no node and the document is never modified by the colours: they are editor decorations, per block, cached by node.",
      "Lazy by construction: nothing of lowlight or highlight.js is imported at the top level. The first block of a language triggers `import()` of the engine (once) and of that grammar (one chunk per language); until it arrives the block shows as plain text, then colours. A failed chunk (offline) leaves the block plain and is retried by the next edit.",
      "Measured, minified and gzipped: lowlight with highlight.js core 8.6 kB (loaded once), then per language: JSON 0.3 kB, HTML/XML 0.8 kB, Python 1.4 kB, Rust 1.4 kB, Shell 1.5 kB, SQL 2.4 kB, JavaScript 2.6 kB, TypeScript 3.0 kB, CSS 4.1 kB. A page using only TypeScript downloads about 11.6 kB.",
      "The core half is dependency-free (about 1 kB): a test bundles it and checks that no lowlight, highlight.js or KaTeX code is in the output.",
      'Static view: pass a synchronous function to `createCodeHighlight({ highlight })` and put the result in the list you give `RichTextView`. On a server, `await loadHighlighter(["typescript"])` from the editor half returns such a function once the grammars are loaded.',
      "Colours are design tokens: custom properties `--fg-rt-tok-keyword`, `-string`, `-number`, `-literal`, `-comment`, `-function`, `-type`, `-variable`, `-attr`, `-tag`, `-operator`, `-punctuation`, `-meta`, `-addition`, `-deletion` on `.fg-rt`, defaulting to `--accent`, `--success`, `--warning`, `--danger` and the ink tokens. Comments are italic, functions semi-bold, so the code reads without colour alone.",
      "The selector is a native `select` in a zero-height row before the block (no layout shift); in a read-only editor it is a plain label. An unknown language written in the document stays selectable as it is written.",
      "Not verified: IME inside code, a screen reader on the selector beyond its label, languages other than the ones tested, very large blocks (the whole block is re-tokenised per keystroke, capped by `maxLength`).",
    ],
    usage: `import { RichTextEditor, RichTextView } from "@forgeron/richtext/react";
import { fullEditorPlugins } from "@forgeron/richtext/plugins/editor";
import { codeHighlight } from "@forgeron/richtext/plugins/editor/code-highlight";
import { fullCorePlugins } from "@forgeron/richtext/plugins";
import { createCodeHighlight } from "@forgeron/richtext/plugins/code-highlight";

const plugins = [...fullEditorPlugins, codeHighlight]; // module scope
<RichTextEditor plugins={plugins} pluginOptions={{ codeHighlight: { languages: ["typescript", "json"] } }} />;

// Static view: plain by default, coloured with a function you give.
const cores = [...fullCorePlugins, createCodeHighlight({ highlight })];
<RichTextView value={doc} plugins={cores} />;`,
  },
  {
    id: "math",
    family: "advanced",
    name: "Math",
    summary:
      "Inline and block formulas in LaTeX, typeset with KaTeX in the editor and edited in a small inline editor with live preview.",
    core: "@forgeron/richtext/plugins/math",
    editor: "@forgeron/richtext/plugins/editor/math",
    options: [
      {
        name: "renderMath (core, createMath)",
        type: "(tex: string, display: boolean) => string",
        description:
          "Typesets the static view and returns trusted HTML; if it throws, the LaTeX source is shown with an error class. Without it the static view writes the source in a `<code>`.",
        default: "none: LaTeX source in a <code>",
      },
      {
        name: "pluginOptions.math.output",
        type: '"html" | "mathml" | "htmlAndMathml"',
        description:
          "What KaTeX writes in the editor. `mathml` needs no stylesheet or fonts but looks plainer.",
        default: '"htmlAndMathml"',
      },
      {
        name: "pluginOptions.math.macros",
        type: "Record<string, string>",
        description: 'KaTeX macros, for example `{ "\\\\RR": "\\\\mathbb{R}" }`.',
        default: "none",
      },
    ],
    markdown: "Euler: $e^{i\\pi} + 1 = 0$.\n\n$$\n\\int_0^1 x\\,dx = \\frac{1}{2}\n$$",
    notes: [
      "Opt-in: not in the full presets. Two nodes: `mathInline` (inline) and `mathBlock`, each with a `tex` attribute holding the source; nothing typeset is stored, so any renderer can draw them later.",
      'Typing `$x^2$` turns into an inline formula when the closing `$` is typed (Backspace undoes it); `$$` and a space at the start of a line gives a block; the slash menu has "Math block". A new block opens its editor at once.',
      "Clicking a formula opens the editor under it: the LaTeX, a live preview, and the message of KaTeX when the source is not valid (the field is marked invalid and the formula keeps its source and an error style). Enter applies (Ctrl or Cmd+Enter in a block, where Enter is a new line), Escape cancels, clicking elsewhere applies.",
      "Markdown follows pandoc's rule so prices stay text: the opening `$` has no space after it, the closing one no space before and no digit after. A literal `$a$` typed as text is written back as a formula; there is no escape for it in the shared Markdown writer.",
      "Lazy: KaTeX and its stylesheet are fetched the first time a formula is drawn; a page with no formula downloads nothing. Measured, minified and gzipped: KaTeX 75.2 kB, stylesheet 3.6 kB, plus its fonts on demand as woff2 (a simple formula needs Main-Regular 26 kB and Math-Italic 16 kB; the whole set is 296 kB).",
      "The core half is dependency-free (about 2 kB). For a static view that typesets, `const renderMath = await katexRenderer()` (editor half, loads KaTeX) gives a function for `createMath({ renderMath })`; the page then imports `katex/dist/katex.min.css` itself. The returned HTML is not escaped: it must come from a typesetter you trust (KaTeX with `trust: false`, the default here).",
      "The icon name of the slash entry is `calculator-01`; it must be in the icon table of the host app, otherwise the menu shows a list icon.",
      "Not verified: IME in the LaTeX field, a screen reader on the editor and the formula (KaTeX's MathML is present with the default output), touch, selecting across a formula with the keyboard only (arrow keys step over an inline formula; clicking opens it).",
    ],
    usage: `import { math } from "@forgeron/richtext/plugins/editor/math";
import { createMath } from "@forgeron/richtext/plugins/math";
import { katexRenderer } from "@forgeron/richtext/plugins/editor/math";

<RichTextEditor plugins={[...fullEditorPlugins, math]} pluginOptions={{ math: { macros: { "\\\\RR": "\\\\mathbb{R}" } } }} />;

// Static view that typesets (the page imports katex/dist/katex.min.css):
const renderMath = await katexRenderer();
const cores = [...fullCorePlugins, createMath({ renderMath })];
<RichTextView value={doc} plugins={cores} />;`,
  },
  {
    id: "footnote",
    family: "advanced",
    name: "Footnote",
    summary:
      "An inline footnote that holds its note, numbered from the order of the markers, with the notes listed at the foot of the page.",
    core: "@forgeron/richtext/plugins/footnote",
    editor: "@forgeron/richtext/plugins/editor/footnote",
    markdown:
      "A claim[^1] and another[^2].\n\n[^1]: The first source.\n\n[^2]: The second, with **bold**.",
    notes: [
      "Opt-in: not in the full presets. One inline node `footnote` with an `id` attribute and the text of the note as its content (text with marks, no line breaks): the note travels with its reference through copy, paste and collaboration, and a reference can never lose its note.",
      "Numbers are never stored. The editor numbers the markers with CSS counters and draws the list at the foot from the same order, so inserting a footnote anywhere renumbers the others; Markdown, plain text and the static view number from the document order each time they are written.",
      'Editor: the slash menu has "Footnote", which inserts a marker and puts the caret in its note, shown under the marker while the caret is in it. Clicking a marker opens its note; Enter or Escape leaves it; Backspace in an empty note removes the footnote. The list at the foot is plain text; clicking an entry puts the caret in that note.',
      "Markdown: `[^1]` and `[^1]: text` (indented lines continue the note). Labels are read as ids and written back as 1, 2, 3 in reading order, so a canonical document round-trips exactly. A reference with no definition stays as the text `[^x]`; a definition no reference uses is kept as a paragraph.",
      "Plain text: markers read `[1]`, and the notes are appended as `[1] text` lines, so a search finds them. Static view: a `sup` with a link per marker and a `section` with an ordered list of notes (each with a back link) after the document; anchors are `fn-N` and `fnref-N`.",
      "Needs two hooks the plugin contract gained for it (`CorePlugin.document`: prepare, markdown, text, render, fromMarkdown); other plugins can use them too.",
      "No heavy dependency: the whole plugin is plain ProseMirror and DOM, about 4 kB minified in the editor half.",
      "Not verified: IME in a note, a screen reader (the marker is a plain `sup`; the note is not announced when it opens), touch, a note containing links or other inline nodes (only text with marks is allowed), footnotes inside table cells in Markdown.",
    ],
    usage: `import { footnote } from "@forgeron/richtext/plugins/editor/footnote";
import { footnote as footnoteCore } from "@forgeron/richtext/plugins/footnote";

<RichTextEditor plugins={[...fullEditorPlugins, footnote]} />;
<RichTextView value={doc} plugins={[...fullCorePlugins, footnoteCore]} />; // notes at the foot

toMarkdown(doc, [...fullCorePlugins, footnoteCore]); // "text[^1]\\n\\n[^1]: note"`,
  },
];
