// The plugin host: turns a list of editor halves into what the editor runs on, with no React. It
// orders the plugins by their dependencies (the core halves decide), checks them, builds the
// Tiptap extensions, and gathers what the plugins contribute to each slot.

import { type AnyExtension, type Editor, Extension } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import type { Doc } from "yjs";
import { createRegistry, type Registry } from "../core/plugin";
import type { ReferenceProvider } from "../core/references";
import { withCoreEditor } from "../plugins/editor/core";
import {
  type BlockAction,
  type BlockToolbar,
  type EditorContext,
  type EditorPlugin,
  type HandleAction,
  type HostStorage,
  type ImageRequest,
  type ResolvedBlock,
  type Range,
  type Slots,
  type SuggestionSpec,
  type ToolbarItem,
  type UiComponent,
  HOST_STORAGE,
} from "./plugin";

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

export interface ContextInit {
  collaborative?: boolean;
  placeholder?: () => string;
  requestImage?: () => ImageRequest | undefined;
  references?: () => ReadonlyArray<ReferenceProvider>;
  options?: () => Readonly<Record<string, unknown>>;
}

/** An editor context whose parts are read through functions, so they can change without a rebuild. */
export function createContext(init: ContextInit = {}): EditorContext {
  return {
    collaborative: init.collaborative ?? false,
    get placeholder() {
      return init.placeholder?.() ?? "";
    },
    get requestImage() {
      return init.requestImage?.();
    },
    get references() {
      return init.references?.() ?? [];
    },
    option: <T>(id: string) => init.options?.()[id] as T | undefined,
  };
}

export interface EditorHost {
  readonly registry: Registry;
  /** The plugins in dependency order, the core first. */
  readonly plugins: ReadonlyArray<EditorPlugin>;
  readonly slots: Slots;
  readonly ui: ReadonlyArray<UiComponent>;
  readonly suggestions: ReadonlyArray<SuggestionSpec>;
  /** The Tiptap extensions of the plugins, without the suggestion menus and collaboration. */
  readonly extensions: ReadonlyArray<AnyExtension>;
}

const byOrder = <T extends { order?: number }>(a: T, b: T) => (a.order ?? 100) - (b.order ?? 100);

export function createHost(list: ReadonlyArray<EditorPlugin>, ctx: EditorContext): EditorHost {
  const all = withCoreEditor(list);
  const registry = createRegistry(all.map((p) => p.core));
  const byId = new Map(all.map((p) => [p.core.id, p]));
  const plugins = registry.plugins.map((core) => byId.get(core.id) as EditorPlugin);

  const actions = new Map<string, BlockAction>();
  const turnable = new Set<string>();
  const bubble: ToolbarItem[] = [];
  const handle: HandleAction[] = [];
  const blockToolbar: BlockToolbar[] = [];
  const ui: UiComponent[] = [];
  for (const plugin of plugins) {
    for (const [id, action] of Object.entries(plugin.blocks ?? {})) actions.set(id, action);
    for (const name of plugin.turnable ?? []) turnable.add(name);
    bubble.push(...(plugin.bubble ?? []));
    handle.push(...(plugin.handle ?? []));
    blockToolbar.push(...(plugin.blockToolbar ?? []));
    ui.push(...(plugin.ui ?? []));
  }
  const blocks: ResolvedBlock[] = registry.blocks.flatMap((def) => {
    const action = actions.get(def.id);
    return action ? [{ ...def, action }] : [];
  });
  const slots: Slots = {
    blocks,
    bubble: bubble.sort(byOrder),
    handle: handle.sort(byOrder),
    blockToolbar,
    turnable,
  };

  const storage: HostStorage = {
    actions,
    order: [...actions.keys()].sort(
      (a, b) => (actions.get(b)?.precedence ?? 0) - (actions.get(a)?.precedence ?? 0),
    ),
    ctx,
  };
  const hostStorage = Extension.create({
    name: HOST_STORAGE,
    addStorage: () => storage,
  });

  const extensions: AnyExtension[] = [];
  for (const plugin of plugins) {
    const own =
      typeof plugin.extensions === "function" ? plugin.extensions(ctx) : plugin.extensions;
    extensions.push(...(own ?? []));
  }
  extensions.push(hostStorage);

  const view = { blocks: () => blocks };
  const suggestions = plugins.flatMap((p) => [...(p.suggestions?.(ctx, view) ?? [])]);
  return { registry, plugins, slots, ui, suggestions, extensions };
}

type SuggestionRender = Parameters<typeof Suggestion>[0]["render"];

function suggestionExtension(spec: SuggestionSpec, render: SuggestionRender): AnyExtension {
  const pluginKey = new PluginKey(`fgRichTextSuggestion-${spec.id}`);
  return Extension.create({
    name: `suggestion-${spec.id}`,
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        Suggestion<unknown, unknown>({
          editor,
          pluginKey,
          char: spec.char,
          allowSpaces: spec.allowSpaces ?? false,
          items: ({ query }) => spec.items(query),
          ...(spec.allow
            ? {
                allow: ({ state, range }: { state: Editor["state"]; range: Range }) =>
                  spec.allow?.({ editor, state, range }) ?? true,
              }
            : {}),
          command: ({ editor, range, props }) => spec.command({ editor, range, item: props }),
          render,
        }),
      ];
    },
  });
}

export interface BuildOptions {
  plugins: ReadonlyArray<EditorPlugin>;
  ctx: EditorContext;
  collaboration?: CollaborationOptions | undefined;
  /** How a suggestion menu is drawn; without it the suggestions are not wired. */
  render?: ((spec: SuggestionSpec) => SuggestionRender) | undefined;
}

/** Everything the Tiptap editor is made of for a plugin list, and the host that produced it. */
export function buildExtensions(options: BuildOptions): {
  extensions: AnyExtension[];
  host: EditorHost;
} {
  const host = createHost(options.plugins, options.ctx);
  const extensions: AnyExtension[] = [...host.extensions];
  const { render } = options;
  if (render)
    for (const spec of host.suggestions) extensions.push(suggestionExtension(spec, render(spec)));
  const collab = options.collaboration;
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
  return { extensions, host };
}
