// The advanced content family, editor halves: code highlighting, formulas and footnotes. Opt-in:
// none of these is in `fullEditorPlugins`. Add the list to a preset:
// `[...fullEditorPlugins, ...advancedEditorPlugins]`. KaTeX and highlight.js are loaded on first
// use, never with this file.

import type { EditorPlugin } from "../../tiptap/plugin";
import { codeHighlight } from "./code-highlight";
import { footnote } from "./footnote";
import { math } from "./math";

export {
  codeHighlight,
  loadHighlighter,
  loadLanguage,
  LANGUAGES,
  languageId,
} from "./code-highlight";
export type { CodeHighlightEditorOptions, LanguageDef } from "./code-highlight";
export { footnote } from "./footnote";
export { katexRenderer, loadKatex, math } from "./math";
export type { MathEditorOptions } from "./math";

/** Code highlighting (needs the `codeBlock` plugin), maths and footnotes. */
export const advancedEditorPlugins: ReadonlyArray<EditorPlugin> = [codeHighlight, math, footnote];
