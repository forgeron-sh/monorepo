// What a block of the catalog does to the document, with no React. The blocks come from the
// plugins (`EditorPlugin.blocks`); the host keeps them on the editor, so these functions work for
// whichever plugins the editor has.

import type { Editor } from "@tiptap/core";
import type { BlockId } from "../core/blocks";
import { HOST_STORAGE, type HostStorage, type ImageRequest, type Range } from "./plugin";

export interface ApplyBlockOptions {
  /** Asks the caller for an image (a file picker, an upload); `null` cancels. Without it, the editor's own. */
  requestImage?: ImageRequest | undefined;
}

const storageOf = (editor: Editor) =>
  (editor.storage as unknown as Record<string, HostStorage | undefined>)[HOST_STORAGE];

/**
 * Turns the block under the cursor into `id` (or inserts it): the slash menu, the "turn into"
 * entries and the "+" of the block handle all end here. `range` is the `/query` to remove first.
 * An id no plugin of the editor offers does nothing.
 */
export function applyBlock(
  editor: Editor,
  id: BlockId,
  options: ApplyBlockOptions = {},
  range?: Range,
): void {
  const host = storageOf(editor);
  const action = host?.actions.get(id);
  if (!host || !action) return;
  action.apply({
    editor,
    range,
    ctx: host.ctx,
    requestImage: options.requestImage ?? host.ctx.requestImage,
  });
}

/** The catalog id of the block holding the selection, for the "turn into" menu. */
export function currentBlock(editor: Editor): BlockId {
  const host = storageOf(editor);
  for (const id of host?.order ?? []) {
    if (id !== "paragraph" && host?.actions.get(id)?.isActive?.(editor)) return id;
  }
  return "paragraph";
}
