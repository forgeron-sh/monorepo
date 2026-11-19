// What a block of the catalog does to the document, with no React.

import type { Editor } from "@tiptap/core";
import type { BlockId } from "../core/blocks";

export interface ApplyBlockOptions {
  /** Asks the caller for an image (a file picker, an upload); `null` cancels. Without it, no image block. */
  requestImage?: (() => Promise<{ src: string; alt?: string } | null>) | undefined;
}

/**
 * Turns the block under the cursor into `id` (or inserts it): the slash menu, the "turn into"
 * entries and the "+" of the block handle all end here. `range` is the `/query` to remove first.
 */
export function applyBlock(
  editor: Editor,
  id: BlockId,
  options: ApplyBlockOptions = {},
  range?: { from: number; to: number },
): void {
  const chain = () => {
    const c = editor.chain().focus();
    return range ? c.deleteRange(range) : c;
  };
  switch (id) {
    case "paragraph":
      chain().clearNodes().run();
      return;
    case "heading-1":
    case "heading-2":
    case "heading-3": {
      const level = Number(id.slice(-1)) as 1 | 2 | 3;
      chain().clearNodes().setHeading({ level }).run();
      return;
    }
    case "bullet-list":
      if (editor.isActive("bulletList") && !range) return;
      chain().clearNodes().toggleBulletList().run();
      return;
    case "ordered-list":
      if (editor.isActive("orderedList") && !range) return;
      chain().clearNodes().toggleOrderedList().run();
      return;
    case "task-list":
      if (editor.isActive("taskList") && !range) return;
      chain().clearNodes().toggleList("taskList", "taskItem").run();
      return;
    case "quote":
      chain().clearNodes().setBlockquote().run();
      return;
    case "code-block":
      chain().clearNodes().setCodeBlock().run();
      return;
    case "divider":
      chain().setHorizontalRule().run();
      return;
    case "table":
      chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      return;
    case "image": {
      const ask = options.requestImage;
      if (!ask) return;
      chain().run();
      void ask().then((image) => {
        if (image)
          editor
            .chain()
            .focus()
            .setImage({ src: image.src, alt: image.alt ?? "" })
            .run();
      });
      return;
    }
  }
}

/** The catalog id of the block holding the selection, for the "turn into" menu. */
export function currentBlock(editor: Editor): BlockId {
  if (editor.isActive("heading", { level: 1 })) return "heading-1";
  if (editor.isActive("heading", { level: 2 })) return "heading-2";
  if (editor.isActive("heading", { level: 3 })) return "heading-3";
  if (editor.isActive("taskList")) return "task-list";
  if (editor.isActive("bulletList")) return "bullet-list";
  if (editor.isActive("orderedList")) return "ordered-list";
  if (editor.isActive("blockquote")) return "quote";
  if (editor.isActive("codeBlock")) return "code-block";
  return "paragraph";
}
