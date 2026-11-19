// The Tiptap (ProseMirror) schema and behaviour of the editor, with no React: one list of
// extensions for the full and the minimal variant, with Yjs collaboration swapped in for history
// when a shared document is given. The same list builds the schema that converts JSON to Y.Doc.

import { type AnyExtension, Extension, getSchema } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { PluginKey } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import type { Doc } from "yjs";
import {
  type BlockDef,
  type MentionItem,
  type RichTextVariant,
  filterBlocks,
} from "../core/blocks";
import { applyBlock, type ApplyBlockOptions } from "./commands";

/** A shared document the editor reads and writes instead of its own state. */
export interface CollaborationOptions {
  doc: Doc;
  /** The Y.XmlFragment name inside the doc. Default `content`. */
  field?: string;
  /** Anything with an `awareness` (a y-websocket, Hocuspocus or local provider): carets are shown when it is given. */
  provider?: { awareness: unknown } | null;
  /** Who this editor is, shown on the others' screens. */
  user?: { name: string; color?: string };
}

export const DEFAULT_FIELD = "content";

type SuggestionRender<T> = NonNullable<SuggestionOptions<T, T>["render"]>;

export interface BuildOptions {
  variant: RichTextVariant;
  /** Read on every render, so it can change without rebuilding the editor. */
  placeholder?: (() => string) | undefined;
  collaboration?: CollaborationOptions | undefined;
  /** How the slash menu is drawn; without it there is no slash menu. */
  slash?: {
    render: SuggestionRender<BlockDef>;
    blocks: ReadonlyArray<BlockDef>;
  } & ApplyBlockOptions;
  /** Where the mention list comes from and how it is drawn; without it there are no mentions. */
  mention?: {
    items: (query: string) => MentionItem[] | Promise<MentionItem[]>;
    render: SuggestionRender<MentionItem>;
  };
}

const slashKey = new PluginKey("fgRichTextSlash");
const mentionKey = new PluginKey("fgRichTextMention");

function slashExtension(options: NonNullable<BuildOptions["slash"]>): AnyExtension {
  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [
        Suggestion<BlockDef, BlockDef>({
          editor: this.editor,
          pluginKey: slashKey,
          char: "/",
          allowSpaces: false,
          items: ({ query }) => filterBlocks(options.blocks, query),
          // Not in code, not inside a table cell's first-level toolbar: a paragraph or a heading.
          allow: ({ state, range }) => {
            const parent = state.doc.resolve(range.from).parent;
            return parent.type.name === "paragraph";
          },
          command: ({ editor, range, props }) => {
            applyBlock(editor, props.id, options, range);
          },
          render: options.render,
        }),
      ];
    },
  });
}

export function buildExtensions(options: BuildOptions): AnyExtension[] {
  const full = options.variant === "full";
  const collab = options.collaboration;
  const extensions: AnyExtension[] = [
    StarterKit.configure({
      heading: full ? { levels: [1, 2, 3] } : false,
      blockquote: full ? {} : false,
      codeBlock: full ? {} : false,
      horizontalRule: full ? {} : false,
      // The shared document keeps its own history (Yjs's undo manager is not used: one editor's
      // undo must not undo another's typing), so ProseMirror's history is dropped.
      dropcursor: { color: "var(--accent)", width: 2 },
      undoRedo: collab ? false : {},
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: () => options.placeholder?.() ?? "",
      showOnlyCurrent: true,
      includeChildren: false,
    }),
  ];
  if (full) {
    extensions.push(
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, allowBase64: true }),
    );
  }
  if (options.mention) {
    const { items, render } = options.mention;
    extensions.push(
      Mention.configure({
        HTMLAttributes: { class: "fg-rt-mention" },
        renderText: ({ node }) => `@${String(node.attrs["label"] ?? node.attrs["id"])}`,
        suggestion: {
          pluginKey: mentionKey,
          char: "@",
          items: ({ query }) => items(query),
          render,
        },
      }),
    );
  }
  if (options.slash) extensions.push(slashExtension(options.slash));
  if (collab) {
    extensions.push(
      Collaboration.configure({ document: collab.doc, field: collab.field ?? DEFAULT_FIELD }),
    );
    if (collab.provider) {
      extensions.push(
        CollaborationCaret.configure({
          provider: collab.provider,
          user: { name: collab.user?.name ?? "Anonymous", color: collab.user?.color ?? "#808080" },
          render: (user) => {
            const caret = document.createElement("span");
            caret.className = "fg-rt-caret";
            caret.style.setProperty("--fg-rt-user", String(user["color"] ?? "#808080"));
            const label = document.createElement("span");
            label.className = "fg-rt-caret-label";
            label.textContent = String(user["name"] ?? "");
            caret.append(label);
            return caret;
          },
          selectionRender: (user) => ({
            class: "fg-rt-selection",
            style: `--fg-rt-user: ${String(user["color"] ?? "#808080")}`,
          }),
        }),
      );
    }
  }
  return extensions;
}

/** The ProseMirror schema of the full editor: what JSON <-> Y.Doc conversion needs. */
export function richTextSchema() {
  return getSchema(buildExtensions({ variant: "full" }));
}
