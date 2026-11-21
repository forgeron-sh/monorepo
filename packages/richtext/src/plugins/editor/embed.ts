// Embeds, editor half: a bookmark card for an address. The "Embed" slash entry inserts a block with
// a field for the address; once it is given, the app's `resolveEmbed` (`pluginOptions.embed`) is
// asked for a title, a description and a picture, which are written into the block. The package
// makes no request of its own. This file also lists the whole family as one preset.

import { Node } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Globe02Icon } from "@forgeron/icons";
import { normalizeLink, safeUrl } from "../../core/view";
import { defineEditorPlugin, type EditorContext } from "../../tiptap/plugin";
import { embed as embedCore, hostOf, type EmbedOptions, type EmbedPreview } from "../embed";
import type { EditorPlugin } from "../../tiptap/plugin";
import { startChain } from "./kit";
import { attachment } from "./attachment";
import { addressForm, audio, setNodeAttrs, video } from "./media";
import { editorUrl, h, iconElement, upload } from "./upload";

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const clean = (value: unknown, max: number) => {
  const t = text(value);
  return t ? t.slice(0, max) : undefined;
};

/** What a `resolveEmbed` answer may write into the document: short strings, a safe picture. */
function previewAttrs(preview: EmbedPreview): Record<string, string | null> {
  return {
    title: clean(preview.title, 300) ?? null,
    description: clean(preview.description, 1000) ?? null,
    image: safeUrl(text(preview.image), "image") ?? null,
  };
}

function embedNode(ctx: EditorContext) {
  return Node.create({
    name: "embed",
    group: "block",
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes: () => ({
      url: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-url"),
        renderHTML: (attrs) => (attrs["url"] ? { "data-url": attrs["url"] } : {}),
      },
      title: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-title"),
        renderHTML: (attrs) => (attrs["title"] ? { "data-title": attrs["title"] } : {}),
      },
      description: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-description"),
        renderHTML: (attrs) =>
          attrs["description"] ? { "data-description": attrs["description"] } : {},
      },
      image: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-image"),
        renderHTML: (attrs) => (attrs["image"] ? { "data-image": attrs["image"] } : {}),
      },
    }),
    parseHTML: () => [{ tag: "div[data-embed]" }],
    renderHTML: ({ node, HTMLAttributes }) => [
      "div",
      { "data-embed": "", ...HTMLAttributes },
      text(node.attrs["title"]) ?? text(node.attrs["url"]) ?? "",
    ],
    renderText: ({ node }) => text(node.attrs["title"]) ?? text(node.attrs["url"]) ?? "",
    addNodeView() {
      const editor = this.editor;
      return ({ node, getPos }) => {
        let current = node;
        let note: string | undefined;
        let loading = false;
        let abort: AbortController | undefined;
        const dom = h("div", { class: "fg-rt-embed", contenteditable: "false" });

        const resolve = (url: string, target: PMNode) => {
          const ask = ctx.option<EmbedOptions>("embed")?.resolveEmbed;
          if (!ask) return;
          abort?.abort();
          const controller = new AbortController();
          abort = controller;
          loading = true;
          note = undefined;
          render();
          ask(url, controller.signal).then(
            (preview) => {
              if (controller.signal.aborted) return;
              loading = false;
              const pos = getPos();
              const now = typeof pos === "number" ? editor.state.doc.nodeAt(pos) : null;
              if (now?.type === target.type && now.attrs["url"] === url) {
                setNodeAttrs(editor, getPos, now, previewAttrs(preview));
              } else render();
            },
            () => {
              if (controller.signal.aborted) return;
              loading = false;
              note = "No preview available";
              render();
            },
          );
        };

        function render() {
          const url = text(current.attrs["url"]);
          if (!url) {
            dom.replaceChildren(
              addressForm({
                label: "Address to embed",
                placeholder: "Paste a link",
                action: "Embed",
                parse: (value) => normalizeLink(value),
                onSubmit: (value) => {
                  setNodeAttrs(editor, getPos, current, { url: value });
                  resolve(value, current);
                },
              }),
            );
            return;
          }
          const href = editorUrl(url);
          const image = safeUrl(text(current.attrs["image"]), "image");
          const body = [
            ...(image
              ? [h("img", { class: "fg-rt-embed-image", src: image, alt: "", loading: "lazy" })]
              : []),
            h("span", { class: "fg-rt-embed-text" }, [
              h("span", { class: "fg-rt-embed-title" }, [
                iconElement(Globe02Icon),
                text(current.attrs["title"]) ?? url,
              ]),
              ...(text(current.attrs["description"])
                ? [
                    h("span", { class: "fg-rt-embed-description" }, [
                      text(current.attrs["description"]) as string,
                    ]),
                  ]
                : []),
              h("span", { class: "fg-rt-embed-host", "aria-live": "polite" }, [
                loading ? "Loading preview" : (note ?? hostOf(url)),
              ]),
            ]),
          ];
          dom.replaceChildren(
            href
              ? h(
                  "a",
                  { class: "fg-rt-embed-link", href, rel: "noopener noreferrer", target: "_blank" },
                  body,
                )
              : h("span", { class: "fg-rt-embed-link" }, body),
          );
        }
        render();

        return {
          dom,
          update: (next) => {
            if (next.type !== current.type) return false;
            current = next;
            render();
            return true;
          },
          stopEvent: (event) =>
            event.target instanceof Element && !!event.target.closest("input,button,a"),
          destroy: () => abort?.abort(),
        };
      };
    },
  });
}

export const embed = defineEditorPlugin({
  core: embedCore,
  extensions: (ctx) => [embedNode(ctx)],
  blocks: {
    embed: {
      apply: ({ editor, range }) =>
        void startChain(editor, range).insertContent({ type: "embed" }).run(),
      isActive: (editor) => editor.isActive("embed"),
    },
  },
});

/**
 * The whole family: the upload flow, files, audio, video and embeds. Not part of the `full`
 * preset: an app opts in, usually with `[...fullEditorPlugins, ...attachmentsPlugins]`, and gives
 * `pluginOptions={{ upload: { upload }, embed: { resolveEmbed } }}`.
 */
export const attachmentsPlugins: ReadonlyArray<EditorPlugin> = [
  upload,
  attachment,
  audio,
  video,
  embed,
];
