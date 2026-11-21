// The upload flow, editor half: drop and paste files on the editor, a file picker behind a slash
// entry, and a card with progress, Retry and Remove while the app's `upload` runs. The app provides
// the function (`pluginOptions.upload`); the package makes no request.
//
// A pending upload is NOT part of the document. It is a widget decoration of the editor view,
// placed at a position that follows the edits around it (and, when the document is shared, at a
// Yjs relative position that follows the other people's edits too). So `onChange`, `getJSON()` and
// the shared Y.Doc never hold a placeholder: nothing half-done is saved, and nobody else sees an
// upload that is not finished. When it ends, the real block is inserted in one transaction at the
// anchor. A failed or cancelled upload stays on screen, in this editor only, with Retry and Remove.
//
// Everything here is plain DOM: no React, so the schema can be built on a server.

import { type Editor, Extension } from "@tiptap/core";
import type { Node as PMNode, NodeType } from "@tiptap/pm/model";
import { type EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  absolutePositionToRelativePosition,
  relativePositionToAbsolutePosition,
  ySyncPluginKey,
} from "@tiptap/y-tiptap";
import type { RelativePosition } from "yjs";
import {
  Archive03Icon,
  AttachmentIcon,
  Cancel01Icon,
  Doc01Icon,
  FileCodeCornerIcon,
  FileEmpty01Icon,
  FileTextIcon,
  Image03Icon,
  type IconDefinition,
  Music02Icon,
  Pdf01Icon,
  Presentation04Icon,
  Refresh01Icon,
  SheetIcon,
  TrashIcon,
  Video02Icon,
  iconTree,
  type SvgElement,
  Link04Icon,
} from "@forgeron/icons";
import { registerBlockIcons } from "../../react/icons";
import { safeUrl } from "../../core/view";
import { defineEditorPlugin, type EditorContext, type Range } from "../../tiptap/plugin";
import {
  type FileBlock,
  type FileKind,
  type UploadOptions,
  type UploadRejection,
  blockForFile,
  fileKind,
  formatFileSize,
  matchesAccept,
  upload as uploadCore,
} from "../attachment";
import { startChain } from "./kit";

registerBlockIcons({
  attachment: AttachmentIcon,
  music: Music02Icon,
  "video-02": Video02Icon,
  "link-04": Link04Icon,
});

/* ================================================================== Small DOM helpers (shared) */

type Attr = string | number | boolean | undefined;

/** An element with attributes and children, in one call. `class` sets the class list. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Readonly<Record<string, Attr>> = {},
  children: ReadonlyArray<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    node.setAttribute(name, value === true ? "" : String(value));
  }
  node.append(...children);
  return node;
}

function svgNode(tree: SvgElement): SVGElement {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tree.tag);
  for (const [name, value] of Object.entries(tree.attrs)) node.setAttribute(name, String(value));
  for (const [name, value] of Object.entries(tree.style ?? {})) {
    node.style.setProperty(name, String(value));
  }
  if (tree.text !== undefined) node.textContent = tree.text;
  for (const child of tree.children ?? []) node.append(svgNode(child));
  return node;
}

/** A pixel icon as an `<svg>` element, drawn in the current text colour. */
export function iconElement(icon: IconDefinition, size = 12): SVGElement {
  return svgNode(iconTree(icon, { size, variant: "mono" }));
}

const KIND_ICONS: Record<FileKind, IconDefinition> = {
  image: Image03Icon,
  audio: Music02Icon,
  video: Video02Icon,
  pdf: Pdf01Icon,
  archive: Archive03Icon,
  sheet: SheetIcon,
  slides: Presentation04Icon,
  doc: Doc01Icon,
  code: FileCodeCornerIcon,
  text: FileTextIcon,
  file: FileEmpty01Icon,
};

/** The pixel icon of a file kind. */
export const kindIcon = (kind: FileKind): IconDefinition => KIND_ICONS[kind];

/** The address a card may link to inside the editor: the safe schemes and `blob:` for a local file. */
export function editorUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const url = value.trim();
  return /^blob:/i.test(url) ? url : safeUrl(url);
}

/** Options of the upload plugin: `pluginOptions.upload`. */
export const uploadOptionsOf = (ctx: EditorContext): UploadOptions =>
  ctx.option<UploadOptions>("upload") ?? {};

/** `true` when the app gave an `upload` function. */
export const uploadAvailable = (ctx: EditorContext): boolean =>
  uploadOptionsOf(ctx).upload !== undefined;

/* ================================================================== The controller */

export type PendingStatus = "uploading" | "error";

/** What the card of an unfinished upload shows. */
export interface PendingUpload {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  /** The block the file becomes once it is uploaded. */
  readonly block: FileBlock;
  readonly status: PendingStatus;
  /** 0 to 1. */
  readonly progress: number;
  /** Why it failed (`error` only). */
  readonly message: string | undefined;
  /** A refused file (type, size) cannot be retried, only removed. */
  readonly retryable: boolean;
}

/** Where a batch of files goes: a document position, or a slot reserved earlier by `reserve`. */
export type Placement = { readonly pos: number } | { readonly slot: string };

export interface PickOptions {
  /** The `accept` of the file dialog. Default: the plugin option, else every file. */
  accept?: string;
  /** Where the files go. Default: after the block holding the cursor. */
  at?: Placement;
}

export interface UploadController {
  /** The app gave an `upload` function. */
  readonly available: boolean;
  /** Unfinished uploads of this editor: uploading, or failed. Never part of the document. */
  pending(): ReadonlyArray<PendingUpload>;
  /** Hears every change of `pending()`; returns the way to stop. */
  subscribe(listener: () => void): () => void;
  /** Takes files (a drop, a paste, a picker): checks them, shows a card each, uploads. */
  add(files: ReadonlyArray<File>, at?: Placement): void;
  /** Opens the file dialog; what is chosen goes through `add`. */
  pick(options?: PickOptions): void;
  /** Aborts an upload that is running: it becomes a failed card. */
  cancel(id: string): void;
  /** Starts a failed upload again. */
  retry(id: string): void;
  /** Aborts if running and removes the card. */
  remove(id: string): void;
  /** Reserves a place in the document that follows the edits, for a later `add`. */
  reserve(): string;
  /** Aborts everything and forgets it (the editor is going away). */
  destroy(): void;
}

interface Anchor {
  id: string;
  pos: number;
  /** Position in the shared document, when there is one: survives the other people's edits. */
  rel: RelativePosition | undefined;
  order: number;
  /** An empty paragraph right after the anchor is replaced by the block (a slash entry's). */
  replaceEmpty: boolean;
}

interface AnchorMeta {
  add?: Anchor;
  remove?: string;
  /** What was inserted in this transaction, so anchors queued behind it stay behind it. */
  inserted?: { pos: number; size: number; order: number };
}

const uploadKey = new PluginKey<readonly Anchor[]>("fgUpload");

interface Item {
  readonly id: string;
  readonly file: File;
  readonly block: FileBlock;
  readonly order: number;
  readonly el: HTMLElement;
  status: PendingStatus;
  progress: number;
  message: string | undefined;
  retryable: boolean;
  abort: AbortController | undefined;
  update(): void;
}

const NODE_FOR: Record<FileBlock, string> = {
  image: "image",
  audio: "audio",
  video: "video",
  attachment: "attachment",
};

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

function errorMessage(error: unknown): string {
  if (typeof error === "string" && error) return error;
  if (error instanceof Error && error.message) return error.message;
  return "Upload failed";
}

/** Where a block may go: the position itself if it takes a block there, else after its block. */
function fit(doc: PMNode, pos: number, type: NodeType): number {
  const at = Math.min(Math.max(pos, 0), doc.content.size);
  const $ = doc.resolve(at);
  for (let depth = $.depth; depth >= 0; depth--) {
    const where = depth === $.depth ? at : $.after(depth + 1);
    const $where = doc.resolve(where);
    if ($where.parent.canReplaceWith($where.index(), $where.index(), type)) return where;
  }
  return doc.content.size;
}

/** The current position of an anchor: from the shared document when there is one, else mapped. */
function positionOf(state: EditorState, anchor: Anchor): number {
  if (anchor.rel) {
    const y = ySyncPluginKey.getState(state);
    if (y?.type && y.binding) {
      const pos = relativePositionToAbsolutePosition(y.doc, y.type, anchor.rel, y.binding.mapping);
      if (pos !== null) return Math.min(Math.max(pos, 0), state.doc.content.size);
    }
  }
  return Math.min(anchor.pos, state.doc.content.size);
}

/** A position that sits between blocks: inside a text block it moves to after that block. */
function boundary(doc: PMNode, pos: number): number {
  const $ = doc.resolve(pos);
  return $.parent.inlineContent ? $.after() : pos;
}

/** The files of a drop or a paste. */
export function filesOf(transfer: DataTransfer | null | undefined): File[] {
  if (!transfer) return [];
  if (transfer.files && transfer.files.length > 0) return Array.from(transfer.files);
  const out: File[] = [];
  for (const item of Array.from(transfer.items ?? [])) {
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) out.push(file);
    }
  }
  return out;
}

function createPendingView(
  item: () => Item,
  actions: Pick<UploadController, "cancel" | "retry" | "remove">,
) {
  const icon = h("span", { class: "fg-rt-file-icon" });
  const name = h("span", { class: "fg-rt-file-name" });
  const status = h("span", { class: "fg-rt-pending-status", role: "status" });
  const bar = h("div", { class: "fg-rt-progress-bar" });
  const progress = h(
    "div",
    {
      class: "fg-rt-progress",
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
    },
    [bar],
  );
  const button = (label: string, icon: IconDefinition, run: () => void, danger = false) => {
    const el = h(
      "button",
      {
        type: "button",
        class: danger ? "fg-rt-pending-action fg-rt-pending-danger" : "fg-rt-pending-action",
        "aria-label": label,
      },
      [iconElement(icon), label],
    );
    el.addEventListener("click", (event) => {
      event.preventDefault();
      run();
    });
    return el;
  };
  const cancel = button("Cancel", Cancel01Icon, () => actions.cancel(item().id));
  const retry = button("Retry", Refresh01Icon, () => actions.retry(item().id));
  const remove = button("Remove", TrashIcon, () => actions.remove(item().id), true);
  const root = h("div", { class: "fg-rt-pending", role: "group", contenteditable: "false" }, [
    icon,
    h("span", { class: "fg-rt-pending-body" }, [name, status, progress]),
    h("span", { class: "fg-rt-pending-actions" }, [cancel, retry, remove]),
  ]);
  let iconKind: FileKind | undefined;
  const update = () => {
    const it = item();
    const kind = fileKind(it.file.name, it.file.type);
    if (kind !== iconKind) {
      iconKind = kind;
      icon.replaceChildren(iconElement(kindIcon(kind)));
    }
    root.dataset["status"] = it.status;
    root.setAttribute("aria-label", `Upload of ${it.file.name}`);
    name.textContent = it.file.name;
    const size = formatFileSize(it.file.size);
    const pct = Math.round(it.progress * 100);
    status.textContent =
      it.status === "uploading"
        ? [size, it.progress > 0 ? `${pct}%` : "Uploading"].filter(Boolean).join(" · ")
        : (it.message ?? "Upload failed");
    status.setAttribute("role", it.status === "error" ? "alert" : "status");
    progress.hidden = it.status !== "uploading";
    progress.setAttribute("aria-valuenow", String(pct));
    progress.setAttribute("aria-label", `Uploading ${it.file.name}`);
    bar.style.width = `${pct}%`;
    const hadFocus = root.contains(root.ownerDocument.activeElement);
    cancel.hidden = it.status !== "uploading";
    retry.hidden = !(it.status === "error" && it.retryable);
    remove.hidden = it.status !== "error";
    if (hadFocus && root.ownerDocument.activeElement instanceof HTMLElement) {
      if (root.ownerDocument.activeElement.hidden) {
        [cancel, retry, remove].find((b) => !b.hidden)?.focus();
      }
    }
  };
  return { el: root, update };
}

interface Internal extends UploadController {
  /** The element of an unfinished upload, for the decoration. */
  elementOf(id: string): HTMLElement | undefined;
  orderOf(id: string): number;
}

function createController(editor: Editor, ctx: EditorContext): Internal {
  const items = new Map<string, Item>();
  const listeners = new Set<() => void>();
  let counter = 0;
  let destroyed = false;
  const pickers = new Set<HTMLInputElement>();
  const options = () => uploadOptionsOf(ctx);
  const alive = () => !destroyed && !editor.isDestroyed;
  const notify = () => {
    for (const item of items.values()) item.update();
    for (const listener of [...listeners]) listener();
  };

  const dispatchMeta = (meta: AnchorMeta, tr = editor.state.tr) =>
    editor.view.dispatch(tr.setMeta(uploadKey, meta));

  /** The anchors of the editor (those with a card and the reserved slots). */
  const anchors = () => uploadKey.getState(editor.state) ?? [];

  function createAnchor(
    id: string,
    placement: Placement | undefined,
    order: number,
    first = true,
  ): void {
    const { state } = editor;
    let pos = state.selection.to;
    let reuse: Anchor | undefined;
    if (placement && "slot" in placement) {
      reuse = anchors().find((a) => a.id === placement.slot);
      if (reuse) pos = positionOf(state, reuse);
    } else if (placement) {
      pos = Math.min(Math.max(placement.pos, 0), state.doc.content.size);
    }
    let replaceEmpty = first && (reuse?.replaceEmpty ?? false);
    if (!reuse) {
      const $ = state.doc.resolve(pos);
      if (
        $.parent.isTextblock &&
        $.parent.type.name === "paragraph" &&
        $.parent.content.size === 0
      ) {
        pos = $.before();
        replaceEmpty = first;
      } else {
        pos = boundary(state.doc, pos);
      }
    }
    const y = ySyncPluginKey.getState(state);
    const rel =
      y?.type && y.binding
        ? absolutePositionToRelativePosition(pos, y.type, y.binding.mapping)
        : undefined;
    dispatchMeta({ add: { id, pos, rel, order, replaceEmpty } });
  }

  /** Puts the finished block in the document, at its anchor, and drops the anchor. */
  function finish(item: Item, json: { type: string; attrs: Record<string, unknown> }): boolean {
    const { state } = editor;
    const anchor = anchors().find((a) => a.id === item.id);
    const type = state.schema.nodes[json.type];
    if (!anchor || !type) return false;
    const node = type.create(json.attrs);
    const at = fit(state.doc, boundary(state.doc, positionOf(state, anchor)), type);
    let to = at;
    if (anchor.replaceEmpty) {
      const after = state.doc.resolve(at).nodeAfter;
      if (after?.type.name === "paragraph" && after.content.size === 0) to = at + after.nodeSize;
    }
    const tr = state.tr.replaceWith(at, to, node);
    dispatchMeta(
      { remove: item.id, inserted: { pos: at, size: node.nodeSize, order: item.order } },
      tr,
    );
    return true;
  }

  function release(id: string): void {
    if (anchors().some((a) => a.id === id)) dispatchMeta({ remove: id });
  }

  function fail(item: Item, message: string, retryable = true): void {
    item.status = "error";
    item.message = message;
    item.retryable = retryable;
    item.abort = undefined;
    notify();
  }

  async function run(item: Item): Promise<void> {
    const upload = options().upload;
    if (!upload) return fail(item, "Uploads are not available", false);
    const abort = new AbortController();
    item.abort = abort;
    item.status = "uploading";
    item.progress = 0;
    item.message = undefined;
    notify();
    const current = () =>
      alive() && items.get(item.id) === item && item.status === "uploading" && item.abort === abort;
    try {
      const result = await upload(item.file, {
        signal: abort.signal,
        onProgress: (ratio) => {
          if (!current()) return;
          item.progress = clamp01(ratio);
          notify();
        },
      });
      if (!current()) return;
      if (abort.signal.aborted) return fail(item, "Upload cancelled");
      const src = typeof result?.src === "string" ? result.src.trim() : "";
      if (!src) return fail(item, "The upload returned no address");
      const name = result.name?.trim() || item.file.name;
      const size =
        typeof result.size === "number" && result.size >= 0 ? result.size : item.file.size;
      const type = result.type || item.file.type || undefined;
      const json =
        item.block === "image"
          ? { type: "image", attrs: { src, alt: name } }
          : item.block === "attachment"
            ? { type: "attachment", attrs: { src, name, size, type: type ?? null } }
            : { type: item.block, attrs: { src, title: name } };
      if (!finish(item, json)) return fail(item, "The place for this file is gone");
      items.delete(item.id);
      notify();
    } catch (error) {
      if (!current()) return;
      fail(item, abort.signal.aborted ? "Upload cancelled" : errorMessage(error));
    }
  }

  const blockFor = (file: File): FileBlock | undefined => {
    const wanted = blockForFile(file);
    const nodes = editor.state.schema.nodes;
    return [wanted, "attachment" as const].find((b) => nodes[NODE_FOR[b]] !== undefined);
  };

  const api: Internal = {
    get available() {
      return options().upload !== undefined;
    },
    pending: () =>
      [...items.values()].map((i) => ({
        id: i.id,
        name: i.file.name,
        size: i.file.size,
        type: i.file.type,
        block: i.block,
        status: i.status,
        progress: i.progress,
        message: i.message,
        retryable: i.retryable,
      })),
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    add(files, at) {
      if (!alive() || files.length === 0) return;
      const { accept, maxSize, onReject } = options();
      const rejected: UploadRejection[] = [];
      const started: Item[] = [];
      let first = true;
      for (const file of files) {
        const block = blockFor(file);
        let refusal: UploadRejection["reason"] | undefined;
        if (!block || !matchesAccept(file, accept)) refusal = "type";
        else if (maxSize !== undefined && file.size > maxSize) refusal = "size";
        const id = `upload-${++counter}`;
        let item!: Item;
        const view = createPendingView(() => item, api);
        item = {
          id,
          file,
          block: block ?? "attachment",
          order: counter,
          el: view.el,
          status: "error",
          progress: 0,
          message: undefined,
          retryable: false,
          abort: undefined,
          update: view.update,
        };
        items.set(id, item);
        createAnchor(id, at, item.order, first);
        first = false;
        if (refusal) {
          rejected.push({ file, reason: refusal });
          item.message =
            refusal === "size"
              ? `${file.name} is larger than ${formatFileSize(maxSize ?? 0)}`
              : `${file.name} is not an accepted type`;
          view.update();
        } else {
          started.push(item);
        }
      }
      if (at && "slot" in at) release(at.slot);
      notify();
      if (rejected.length > 0) onReject?.(rejected);
      for (const item of started) void run(item);
    },
    pick(pickOptions = {}) {
      if (!alive() || !api.available) return;
      const slot = pickOptions.at ?? { slot: api.reserve() };
      const doc = editor.view.dom.ownerDocument;
      const input = doc.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.hidden = true;
      const accept = pickOptions.accept ?? options().accept;
      if (accept) input.accept = accept;
      input.setAttribute("data-fg-rt-picker", "");
      doc.body.append(input);
      pickers.add(input);
      const drop = () => {
        pickers.delete(input);
        input.remove();
      };
      input.addEventListener(
        "change",
        () => {
          const files = Array.from(input.files ?? []);
          drop();
          if (files.length > 0) api.add(files, slot);
          else if ("slot" in slot) release(slot.slot);
        },
        { once: true },
      );
      input.addEventListener(
        "cancel",
        () => {
          drop();
          if ("slot" in slot) release(slot.slot);
        },
        { once: true },
      );
      input.click();
    },
    reserve() {
      const id = `slot-${++counter}`;
      createAnchor(id, undefined, counter);
      return id;
    },
    cancel(id) {
      const item = items.get(id);
      if (!item || item.status !== "uploading") return;
      const abort = item.abort;
      fail(item, "Upload cancelled");
      abort?.abort();
    },
    retry(id) {
      const item = items.get(id);
      if (!item || item.status !== "error" || !item.retryable) return;
      void run(item);
    },
    remove(id) {
      const item = items.get(id);
      if (!item) return;
      const abort = item.abort;
      items.delete(id);
      item.abort = undefined;
      abort?.abort();
      if (alive()) release(id);
      notify();
    },
    destroy() {
      destroyed = true;
      for (const item of items.values()) item.abort?.abort();
      items.clear();
      listeners.clear();
      for (const input of pickers) input.remove();
      pickers.clear();
    },
    elementOf: (id) => items.get(id)?.el,
    orderOf: (id) => items.get(id)?.order ?? 0,
  };
  return api;
}

/* ================================================================== The editor extension */

/** The controller of an editor that has the upload plugin; `undefined` without it. */
export function uploadsOf(editor: Editor): UploadController | undefined {
  const storage = editor.storage as unknown as Record<string, { controller?: UploadController }>;
  return storage["fgUpload"]?.controller;
}

/** The slash action of a block that is filled from a file: closes the `/query`, opens the dialog. */
export function pickFromSlash(editor: Editor, range: Range | undefined, accept?: string): void {
  startChain(editor, range).run();
  uploadsOf(editor)?.pick(accept ? { accept } : {});
}

const hasText = (transfer: DataTransfer | null) =>
  !!transfer && transfer.getData("text/plain").trim() !== "";

function uploadExtension(ctx: EditorContext) {
  return Extension.create<Record<string, never>, { controller: UploadController | undefined }>({
    name: "fgUpload",
    addStorage: () => ({ controller: undefined }),
    onDestroy() {
      this.storage.controller?.destroy();
    },
    addProseMirrorPlugins() {
      const controller = createController(this.editor, ctx);
      this.storage.controller = controller;
      return [
        new Plugin<readonly Anchor[]>({
          key: uploadKey,
          state: {
            init: () => [],
            apply(tr, anchors) {
              const meta = tr.getMeta(uploadKey) as AnchorMeta | undefined;
              let next = tr.docChanged
                ? anchors.map((a) => ({ ...a, pos: tr.mapping.map(a.pos, -1) }))
                : anchors;
              const inserted = meta?.inserted;
              if (inserted) {
                // Anchors queued behind the finished one (a later file of the same batch) stay behind.
                next = next.map((a) =>
                  a.pos === inserted.pos && a.order > inserted.order
                    ? { ...a, pos: a.pos + inserted.size }
                    : a,
                );
              }
              if (meta?.remove) next = next.filter((a) => a.id !== meta.remove);
              if (meta?.add) next = [...next, meta.add];
              return next;
            },
          },
          props: {
            decorations(state) {
              const anchors = uploadKey.getState(state) ?? [];
              const widgets: Decoration[] = [];
              for (const anchor of anchors) {
                const el = controller.elementOf(anchor.id);
                if (!el) continue;
                widgets.push(
                  Decoration.widget(boundary(state.doc, positionOf(state, anchor)), () => el, {
                    key: anchor.id,
                    side: -1_000_000 + anchor.order,
                    ignoreSelection: true,
                    stopEvent: () => true,
                  }),
                );
              }
              return widgets.length ? DecorationSet.create(state.doc, widgets) : null;
            },
            handleDOMEvents: {
              drop: (view, event) => {
                const drop = event as DragEvent;
                const files = filesOf(drop.dataTransfer);
                if (files.length === 0 || !controller.available || !view.editable) return false;
                drop.preventDefault();
                let pos: number | undefined;
                try {
                  pos = view.posAtCoords({ left: drop.clientX, top: drop.clientY })?.pos;
                } catch {
                  pos = undefined;
                }
                controller.add(files, pos === undefined ? undefined : { pos });
                return true;
              },
              paste: (view, event) => {
                const paste = event as ClipboardEvent;
                const files = filesOf(paste.clipboardData);
                // Text wins: a spreadsheet copied as text also puts a picture of itself on the clipboard.
                if (files.length === 0 || hasText(paste.clipboardData)) return false;
                if (!controller.available || !view.editable) return false;
                paste.preventDefault();
                controller.add(files);
                return true;
              },
            },
          },
        }),
      ];
    },
  });
}

/** The upload flow: drop, paste, the picker of the slash entries, the pending cards. */
export const upload = defineEditorPlugin({
  core: uploadCore,
  extensions: (ctx) => [uploadExtension(ctx)],
});
