import { type Editor, getSchema } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";
import { type MentionItem, type RichTextVariant, filterMentions } from "../core/blocks";
import { type RichDoc, emptyDoc, sameDoc } from "../core/model";
import {
  type Reference,
  type ReferenceProvider,
  type ReferencesChange,
  diffReferences,
  referencesOf,
} from "../core/references";
import { editorPresets } from "../plugins/editor/presets";
import { type CollaborationOptions, buildExtensions, createContext } from "../tiptap/host";
import type { EditorPlugin, ImageRequest } from "../tiptap/plugin";
import { prepareContent, restoreUnknown } from "../tiptap/unknown";
import { cx } from "./cx";
import { SuggestionMenu } from "./suggestion-menu";
import { type SuggestionStore, createSuggestionStore } from "./suggestion-store";

export interface RichTextEditorProps {
  /** Controlled content. The editor shows it and reports edits with `onChange`. */
  value?: RichDoc;
  /** Uncontrolled starting content. */
  defaultValue?: RichDoc;
  /** Every edit, as JSON (also edits that arrive from other people when collaborating). */
  onChange?: (doc: RichDoc) => void;
  /**
   * A preset, sugar for a list of plugins: `full` is a page (blocks, slash menu, block handles),
   * `minimal` marks, lists and mentions. Ignored for what the editor does when `plugins` is given,
   * except for its look (`full` has the page's spacing).
   */
  variant?: RichTextVariant;
  /**
   * The plugins of this editor: everything beyond paragraphs, text and line breaks comes from
   * here. Default: the preset of `variant`. Keep the array stable (module scope or `useMemo`):
   * a new list rebuilds the editor.
   */
  plugins?: ReadonlyArray<EditorPlugin>;
  /** Options by plugin id, read by the plugins (`ctx.option(id)`). */
  pluginOptions?: Readonly<Record<string, unknown>>;
  editable?: boolean;
  placeholder?: string;
  /** Names the writing area for assistive technology. */
  label?: string;
  autoFocus?: boolean;
  /**
   * Who can be mentioned with "@": a fixed list, or a function of what was typed (for a search on
   * a server). Sugar for a reference provider of the kind `user`. Without either, "@" is just a
   * character.
   */
  mentions?: ReadonlyArray<MentionItem>;
  onMentionQuery?: (query: string) => MentionItem[] | Promise<MentionItem[]>;
  /** What else can be referenced (pages, tags...): a trigger character and a source per kind. */
  references?: ReadonlyArray<ReferenceProvider>;
  /**
   * Called with the references that were added or removed since the last report, after each edit
   * that changed them. The editor knows nothing about what a reference means: an app notifies the
   * people mentioned, links a page. `diffReferences` does the same between two saved documents.
   */
  onReferences?: (change: ReferencesChange) => void;
  /** Asks the user for an image (a file picker, an upload). Without it the image block is not offered. */
  requestImage?: ImageRequest;
  /**
   * A shared document: the editor reads and writes it (history is dropped), and shows the others'
   * carets when a `provider` with an `awareness` is given. `value` and `defaultValue` are ignored:
   * seed the doc with `toYDoc`.
   */
  collaboration?: CollaborationOptions;
  /** Floating marks on a selection (the `bubble` plugin). Default `true`. */
  bubble?: boolean;
  /** The "+" and grip at the left of a block (the `blockHandle` plugin). Default `true`. */
  blockHandle?: boolean;
  /** The Tiptap editor, once created: for commands the component does not wrap. */
  onReady?: (editor: Editor) => void;
  className?: string;
}

interface Latest {
  onChange: RichTextEditorProps["onChange"];
  onReferences: RichTextEditorProps["onReferences"];
  onMentionQuery: RichTextEditorProps["onMentionQuery"];
  mentions: RichTextEditorProps["mentions"];
  placeholder: string | undefined;
  onReady: RichTextEditorProps["onReady"];
  requestImage: RichTextEditorProps["requestImage"];
  providers: ReadonlyArray<ReferenceProvider>;
  pluginOptions: RichTextEditorProps["pluginOptions"];
}

const identities = new WeakMap<object, number>();
let lastIdentity = 0;
const identity = (item: object) => {
  let id = identities.get(item);
  if (id === undefined) identities.set(item, (id = ++lastIdentity));
  return id;
};

/** The same list while its items are the same: an inline array does not rebuild the editor. */
function useStableList<T extends object>(list: ReadonlyArray<T>): ReadonlyArray<T> {
  const key = list.map(identity).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => list, [key]);
}

/**
 * The rich text editor: Tiptap on ProseMirror underneath, our own interface on top, every feature
 * a plugin. The content is JSON (`RichDoc`); with `collaboration` it lives in a Yjs document.
 *
 * Changing the list of plugins builds a new editor: the interface plugins hold the editor they
 * were given, so the body is mounted again (with its content from `value`) instead of swapping
 * the schema under a live view.
 */
export function RichTextEditor(props: RichTextEditorProps) {
  const list = props.plugins ?? editorPresets[props.variant ?? "full"];
  const key = `${list.map(identity).join(",")}|${props.bubble ?? true}|${props.blockHandle ?? true}`;
  return <RichTextEditorBody key={key} {...props} />;
}

function RichTextEditorBody({
  value,
  defaultValue,
  onChange,
  variant = "full",
  plugins,
  pluginOptions,
  editable = true,
  placeholder,
  label = "Rich text",
  autoFocus,
  mentions,
  onMentionQuery,
  references,
  onReferences,
  requestImage,
  collaboration,
  bubble = true,
  blockHandle = true,
  onReady,
  className,
}: RichTextEditorProps) {
  const hasMentions = mentions !== undefined || onMentionQuery !== undefined;
  const latest = useRef<Latest>({
    onChange,
    onReferences,
    onMentionQuery,
    mentions,
    placeholder,
    onReady,
    requestImage,
    providers: [],
    pluginOptions,
  });
  const providers = useMemo<ReadonlyArray<ReferenceProvider>>(
    () => [
      ...(hasMentions
        ? [
            {
              kind: "user",
              char: "@",
              label: "Mention",
              empty: "No one matches",
              items: (query: string) => {
                const ask = latest.current.onMentionQuery;
                return ask ? ask(query) : filterMentions(latest.current.mentions ?? [], query);
              },
            } satisfies ReferenceProvider,
          ]
        : []),
      ...(references ?? []),
    ],
    [hasMentions, references],
  );
  latest.current = {
    onChange,
    onReferences,
    onMentionQuery,
    mentions,
    placeholder,
    onReady,
    requestImage,
    providers,
    pluginOptions,
  };

  const chosen = useStableList(
    (plugins ?? editorPresets[variant]).filter(
      (p) => !(p.core.id === "bubble" && !bubble) && !(p.core.id === "blockHandle" && !blockHandle),
    ),
  );
  const providerKey = providers.map((p) => `${p.kind}:${p.char ?? "@"}`).join("|");
  const collaborative = collaboration !== undefined;
  const ctx = useMemo(
    () =>
      createContext({
        collaborative,
        placeholder: () => latest.current.placeholder ?? "",
        requestImage: () => latest.current.requestImage,
        references: () => latest.current.providers,
        options: () => latest.current.pluginOptions ?? {},
      }),
    [collaborative],
  );

  const stores = useRef(new Map<string, SuggestionStore<unknown>>());
  const storeFor = (id: string) => {
    let store = stores.current.get(id);
    if (!store) {
      store = createSuggestionStore<unknown>();
      stores.current.set(id, store);
    }
    return store;
  };

  const built = useMemo(
    () =>
      buildExtensions({
        plugins: chosen,
        ctx,
        collaboration,
        render: (spec) => storeFor(spec.id).render,
      }),
    // The schema is rebuilt only when one of these changes; the rest is read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chosen, ctx, collaboration?.doc, collaboration?.field, collaboration?.provider, providerKey],
  );
  const { host: pluginHost } = built;
  const schema = useMemo(() => getSchema(built.extensions), [built]);
  const prepare = (doc: RichDoc) => prepareContent(doc, pluginHost.registry, schema);
  const json = (e: Editor) => restoreUnknown(e.getJSON() as RichDoc) as RichDoc;
  const lastRefs = useRef<Reference[]>([]);

  const root = useRef<HTMLDivElement>(null);
  const editor = useEditor(
    {
      extensions: built.extensions,
      ...(collaboration ? {} : { content: prepare(value ?? defaultValue ?? emptyDoc()) }),
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
      onUpdate: ({ editor: e }) => {
        const doc = json(e);
        latest.current.onChange?.(doc);
        const change = diffReferences(lastRefs.current, doc);
        lastRefs.current = change.all;
        if (change.added.length || change.removed.length) latest.current.onReferences?.(change);
      },
      onCreate: ({ editor: e }) => {
        lastRefs.current = referencesOf(json(e));
        latest.current.onReady?.(e);
      },
    },
    [built],
  );

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  // A controlled value that differs from the document replaces it (without echoing an update).
  useEffect(() => {
    if (!editor || collaboration || value === undefined) return;
    if (!sameDoc(json(editor), value, pluginHost.registry)) {
      editor.commands.setContent(prepareContent(value, pluginHost.registry, schema), {
        emitUpdate: false,
      });
      lastRefs.current = referencesOf(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, collaboration, value]);

  const hasHandle = pluginHost.plugins.some((p) => p.core.id === "blockHandle");
  return (
    <div
      ref={root}
      className={cx(
        "fg-rt",
        `fg-rt-${variant}`,
        editable && "fg-rt-editable",
        editable && hasHandle && "fg-rt-handles",
        className,
      )}
      data-variant={variant}
    >
      <EditorContent editor={editor} />
      {editor && editable ? (
        <>
          {pluginHost.ui.map(({ id, Component }) => (
            <Component key={id} editor={editor} host={root} slots={pluginHost.slots} ctx={ctx} />
          ))}
          {pluginHost.suggestions.map((spec) => (
            <SuggestionMenu key={spec.id} store={storeFor(spec.id)} spec={spec} />
          ))}
        </>
      ) : null}
    </div>
  );
}
