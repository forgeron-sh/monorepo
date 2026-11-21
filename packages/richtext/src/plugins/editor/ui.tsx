// The interface plugins, editor halves: the slash menu (a suggestion made of the plugins' block
// entries), the selection toolbar, the block handle and the block toolbar. Each one draws a slot the
// content plugins contribute to; without it, that part of the interface is simply not there.

import { filterBlocks } from "../../core/blocks";
import {
  blockHandle as blockHandleCore,
  blockToolbar as blockToolbarCore,
  bubble as bubbleCore,
  slash as slashCore,
} from "../ui";
import { BlockHandle, moveBlock } from "../../react/block-handle";
import { BlockToolbars } from "../../react/block-toolbar";
import { BubbleToolbar } from "../../react/bubble-toolbar";
import { UI_ICONS } from "../../react/icons";
import { defineEditorPlugin, defineSuggestion, type ResolvedBlock } from "../../tiptap/plugin";

export const slash = defineEditorPlugin({
  core: slashCore,
  suggestions: (ctx, host) => [
    defineSuggestion<ResolvedBlock>({
      id: "slash",
      char: "/",
      label: "Insert a block",
      empty: "No block matches",
      // Read at each keystroke: an entry can become available (an image once the app can ask).
      items: (query) =>
        filterBlocks(
          host.blocks().filter((b) => b.action.available?.(ctx) !== false),
          query,
        ),
      present: (block) => ({
        key: block.id,
        label: block.label,
        icon: block.icon,
        ...(block.shortcut ? { hint: block.shortcut } : {}),
      }),
      // Not in code, not in a title: a paragraph only.
      allow: ({ state, range }) => state.doc.resolve(range.from).parent.type.name === "paragraph",
      command: ({ editor, range, item }) =>
        item.action.apply({ editor, range, ctx, requestImage: ctx.requestImage }),
    }),
  ],
});

export const bubble = defineEditorPlugin({
  core: bubbleCore,
  ui: [
    {
      id: "bubble",
      Component: ({ editor, slots }) => <BubbleToolbar editor={editor} items={slots.bubble} />,
    },
  ],
});

export const blockToolbar = defineEditorPlugin({
  core: blockToolbarCore,
  ui: [
    {
      id: "blockToolbar",
      Component: ({ editor, slots }) => (
        <BlockToolbars editor={editor} toolbars={slots.blockToolbar} />
      ),
    },
  ],
});

export const blockHandle = defineEditorPlugin({
  core: blockHandleCore,
  handle: [
    {
      id: "duplicate",
      label: "Duplicate",
      icon: UI_ICONS.copy,
      order: 10,
      run: (editor, { pos, node }) =>
        void editor
          .chain()
          .focus()
          .insertContentAt(pos + node.nodeSize, node.toJSON())
          .run(),
    },
    {
      id: "move-up",
      label: "Move up",
      order: 20,
      run: (editor, { pos }) => void moveBlock(editor, pos, "up"),
    },
    {
      id: "move-down",
      label: "Move down",
      order: 30,
      run: (editor, { pos }) => void moveBlock(editor, pos, "down"),
    },
    {
      id: "delete",
      label: "Delete",
      icon: UI_ICONS.trash,
      order: 40,
      danger: true,
      run: (editor, { pos, node }) =>
        void editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + node.nodeSize })
          .run(),
    },
  ],
  ui: [
    {
      id: "blockHandle",
      Component: ({ editor, host, slots, ctx }) => (
        <BlockHandle
          editor={editor}
          host={host}
          blocks={slots.blocks.filter((b) => b.action.available?.(ctx) !== false)}
          actions={slots.handle}
          turnable={slots.turnable}
          requestImage={ctx.requestImage}
        />
      ),
    },
  ],
});
