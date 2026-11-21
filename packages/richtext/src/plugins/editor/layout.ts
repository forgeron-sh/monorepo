// The layout family, editor halves. Add `layoutPlugins` to the list an editor is given, after the
// content plugins and before the interface ones (`slash`, `blockToolbar`...): none is in a preset.

import type { EditorPlugin } from "../../tiptap/plugin";
import { callout } from "./callout";
import { columns } from "./columns";
import { emoji } from "./emoji";
import { toc } from "./toc";
import { toggle } from "./toggle";

export { callout, columns, emoji, toc, toggle };

/** Callout, toggle, columns, table of contents, emoji. */
export const layoutPlugins: ReadonlyArray<EditorPlugin> = [callout, toggle, columns, toc, emoji];
