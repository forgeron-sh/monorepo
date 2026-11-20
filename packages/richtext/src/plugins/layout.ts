// The layout family, core halves: the structural blocks of a page (callout, toggle, columns, table
// of contents) and the emoji picker. They are opt-in: an app adds `layoutPlugins` (or the ones it
// wants) to its list; none of them is in the `full` preset.

import type { CorePlugin } from "../core/plugin";
import { callout } from "./callout";
import { columns } from "./columns";
import { emoji } from "./emoji";
import { toc } from "./toc";
import { toggle } from "./toggle";

export { callout, columns, emoji, toc, toggle };
export { CALLOUT_TONES, type CalloutTone, calloutIcon, calloutTone } from "./callout";
export { MAX_COLUMNS, MIN_COLUMNS, emptyColumns } from "./columns";
export { type EmojiEntry, emojiPicker } from "./emoji";
export { type TocEntry, slugify, tocEntries, uniqueSlugs } from "./toc";

/** Callout, toggle, columns, table of contents, emoji. */
export const layoutPlugins: ReadonlyArray<CorePlugin> = [callout, toggle, columns, toc, emoji];
