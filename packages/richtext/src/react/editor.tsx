import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";
import {
  type BlockDef,
  type MentionItem,
  type RichTextVariant,
  blocksFor,
  filterMentions,
} from "../core/blocks";
import { type RichDoc, emptyDoc, sameDoc } from "../core/model";
import { type CollaborationOptions, buildExtensions } from "../tiptap/extensions";
import { BlockHandle } from "./block-handle";
import { BubbleToolbar } from "./bubble-toolbar";
import { cx } from "./cx";
import { MentionList } from "./mention-list";
import { SlashMenu } from "./slash-menu";
import { createSuggestionStore } from "./suggestion-store";
import { TableToolbar } from "./table-toolbar";

export interface RichTextEditorProps {
  /** Controlled content. The editor shows it and reports edits with `onChange`. */
  value?: RichDoc;
  /** Uncontrolled starting content. */
  defaultValue?: RichDoc;
  /** Every edit, as JSON (also edits that arrive from other people when collaborating). */
  onChange?: (doc: RichDoc) => void;
  /** `full`: a page, with blocks, slash menu and block handles. `minimal`: marks, lists and mentions. */
  variant?: RichTextVariant;
  editable?: boolean;
  placeholder?: string;
  /** Names the writing area for assistive technology. */
  label?: string;
  autoFocus?: boolean;
  /**
   * Who can be mentioned with "@": a fixed list, or a function of what was typed (for a search on
   * a server). Without either, "@" is just a character.
   */
  mentions?: ReadonlyArray<MentionItem>;
  onMentionQuery?: (query: string) => MentionItem[] | Promise<MentionItem[]>;
  /** Asks the user for an image (a file picker, an upload). Without it the image block is not offered. */
  requestImage?: () => Promise<{ src: string; alt?: string } | null>;
  /**
   * A shared document: the editor reads and writes it (history is dropped), and shows the others'
   * carets when a `provider` with an `awareness` is given. `value` and `defaultValue` are ignored:
   * seed the doc with `toYDoc`.
   */
  collaboration?: CollaborationOptions;
  /** Floating marks on a selection. Default `true`. */
  bubble?: boolean;
  /** The "+" and grip at the left of a block (full variant). Default `true`. */
  blockHandle?: boolean;
  /** The Tiptap editor, once created: for commands the component does not wrap. */
  onReady?: (editor: Editor) => void;
  className?: string;
}

/**
 * The rich text editor: Tiptap on ProseMirror underneath, our own interface on top. The content is
 * JSON (`RichDoc`); with `collaboration` it lives in a Yjs document instead.
 */
export function RichTextEditor({
  value,
  defaultValue,
  onChange,
  variant = "full",
  editable = true,
  placeholder,
  label = "Rich text",
  autoFocus,
  mentions,
  onMentionQuery,
  requestImage,
  collaboration,
  bubble = true,
  blockHandle = true,
  onReady,
  className,
}: RichTextEditorProps) {
  const latest = useRef({ onChange, onMentionQuery, mentions, placeholder, onReady });
  latest.current = { onChange, onMentionQuery, mentions, placeholder, onReady };

  const slashStore = useMemo(() => createSuggestionStore<BlockDef>(), []);
  const mentionStore = useMemo(() => createSuggestionStore<MentionItem>(), []);
  const hasMentions = mentions !== undefined || onMentionQuery !== undefined;
  const hasImage = requestImage !== undefined;
  const blocks = useMemo(
    () => blocksFor(variant).filter((b) => b.id !== "image" || hasImage),
    [variant, hasImage],
  );
  const imageRef = useRef(requestImage);
  imageRef.current = requestImage;
  const host = useRef<HTMLDivElement>(null);

  const extensions = useMemo(
    () =>
      buildExtensions({
        variant,
        placeholder: () => latest.current.placeholder ?? "",
        collaboration,
        slash: {
          blocks,
          render: slashStore.render,
          requestImage: () => (imageRef.current ? imageRef.current() : Promise.resolve(null)),
        },
        ...(hasMentions
          ? {
              mention: {
                render: mentionStore.render,
                items: (query: string) => {
                  const ask = latest.current.onMentionQuery;
                  return ask ? ask(query) : filterMentions(latest.current.mentions ?? [], query);
                },
              },
            }
          : {}),
      }),
    // The schema is rebuilt only when one of these changes; the rest is read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      variant,
      collaboration?.doc,
      collaboration?.field,
      collaboration?.provider,
      blocks,
      hasMentions,
    ],
  );

  const editor = useEditor(
    {
      extensions,
      ...(collaboration ? {} : { content: value ?? defaultValue ?? emptyDoc() }),
      editable,
      autofocus: autoFocus ? "end" : false,
      editorProps: {
        attributes: {
          class: "fg-rt-content",
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": label,
        },
      },
      onUpdate: ({ editor: e }) => latest.current.onChange?.(e.getJSON() as RichDoc),
      onCreate: ({ editor: e }) => latest.current.onReady?.(e),
    },
    [extensions],
  );

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  // A controlled value that differs from the document replaces it (without echoing an update).
  useEffect(() => {
    if (!editor || collaboration || value === undefined) return;
    if (!sameDoc(editor.getJSON() as RichDoc, value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, collaboration, value]);

  return (
    <div
      ref={host}
      className={cx(
        "fg-rt",
        `fg-rt-${variant}`,
        editable && "fg-rt-editable",
        editable && variant === "full" && blockHandle && "fg-rt-handles",
        className,
      )}
      data-variant={variant}
    >
      <EditorContent editor={editor} />
      {editor && editable ? (
        <>
          {bubble ? <BubbleToolbar editor={editor} /> : null}
          {variant === "full" ? <TableToolbar editor={editor} /> : null}
          {variant === "full" && blockHandle ? (
            <BlockHandle editor={editor} host={host} blocks={blocks} requestImage={requestImage} />
          ) : null}
          <SlashMenu store={slashStore} />
          {hasMentions ? <MentionList store={mentionStore} /> : null}
        </>
      ) : null}
    </div>
  );
}
