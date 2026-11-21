// The clipboard, editor half: duplicate, copy, cut and paste, their keys, and the native copy and
// paste events. Copying writes flow JSON to the system clipboard (so it pastes into another flow
// or a text field), pasting reads it, and without one the last copy is pasted.

import { defineEditorPlugin, type FlowEditorContext } from "../../react/plugin";
import { clipboard as clipboardCore } from "../clipboard";

interface Local {
  /** The JSON of the last copy, waiting for the native copy event to put it on the clipboard. */
  copied: string | null;
  /** The native paste event came: the timer of the paste key has nothing left to do. */
  pasteHandled: boolean;
}

const local = (ctx: FlowEditorContext<unknown>) =>
  ctx.local<Local>("clipboard", () => ({ copied: null, pasteHandled: true }));

export const clipboard = defineEditorPlugin({
  core: clipboardCore,
  tools: {
    duplicate: { label: "Duplicate", run: ({ flow }) => void flow.duplicateSelection() },
    copy: {
      label: "Copy",
      run: (ctx) => {
        // The native copy event follows and puts the JSON on the system clipboard.
        local(ctx).copied = ctx.flow.copySelection();
        return "native";
      },
    },
    cut: {
      label: "Cut",
      run: (ctx) => {
        const l = local(ctx);
        l.copied = ctx.flow.copySelection();
        if (l.copied) ctx.flow.deleteSelection();
        return "native";
      },
    },
    paste: {
      label: "Paste",
      run: (ctx) => {
        // The native paste event reads the system clipboard; without one, the last copy is pasted.
        const l = local(ctx);
        l.pasteHandled = false;
        setTimeout(() => {
          if (!l.pasteHandled) ctx.flow.paste();
          l.pasteHandled = true;
        }, 0);
        return "native";
      },
    },
  },
  shortcuts: [
    { keys: "mod+d", tool: "duplicate" },
    { keys: "mod+c", tool: "copy" },
    { keys: "mod+x", tool: "cut" },
    { keys: "mod+v", tool: "paste" },
  ],
  handlers: {
    copy: (ctx, e) => {
      const l = local(ctx);
      if (!l.copied || !e.clipboardData) return;
      e.clipboardData.setData("text/plain", l.copied);
      l.copied = null;
      e.preventDefault();
    },
    paste: (ctx, e) => {
      local(ctx).pasteHandled = true;
      const text = e.clipboardData?.getData("text/plain");
      const pasted = text ? ctx.flow.paste(text) : [];
      if (pasted.length === 0) ctx.flow.paste();
      e.preventDefault();
    },
  },
});
