// The advanced content family: code highlighting, formulas and footnotes, as core halves. Opt-in:
// none of these is in `fullCorePlugins`. `advancedCorePlugins` lists them; add it to a preset with
// `[...fullCorePlugins, ...advancedCorePlugins]`. The editor halves are in `./editor/advanced`.

import type { CorePlugin } from "../core/plugin";
import { codeHighlight } from "./code-highlight";
import { footnote } from "./footnote";
import { math } from "./math";

export { codeHighlight, createCodeHighlight } from "./code-highlight";
export { footnote } from "./footnote";
export { createMath, math } from "./math";

/** Code highlighting (needs the `codeBlock` plugin), maths and footnotes. */
export const advancedCorePlugins: ReadonlyArray<CorePlugin> = [codeHighlight, math, footnote];
