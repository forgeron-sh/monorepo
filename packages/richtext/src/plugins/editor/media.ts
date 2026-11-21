// Audio and video, editor half: blocks that show the browser's own controls. A block without a
// source shows a field for an address; the slash entries open the file picker of the upload flow
// instead when the app gave an `upload` function.

import { Node } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { safeUrl } from "../../core/view";
import { defineEditorPlugin } from "../../tiptap/plugin";
import { audio as audioCore, video as videoCore } from "../media";
import { startChain } from "./kit";
import { editorUrl, h, pickFromSlash, uploadAvailable } from "./upload";

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** A one-field form: an address typed or pasted, handed to `onSubmit` when it is acceptable. */
export function addressForm(options: {
  label: string;
  placeholder: string;
  action: string;
  /** Returns the cleaned address, or `undefined` to refuse it. */
  parse: (input: string) => string | undefined;
  onSubmit: (value: string) => void;
}) {
  const input = h("input", {
    class: "fg-rt-address-input",
    type: "text",
    inputmode: "url",
    autocomplete: "off",
    spellcheck: "false",
    "aria-label": options.label,
    placeholder: options.placeholder,
  });
  const error = h("span", { class: "fg-rt-address-error", role: "alert", hidden: true });
  const submit = h("button", { class: "fg-rt-address-submit", type: "submit" }, [options.action]);
  const form = h("form", { class: "fg-rt-address", contenteditable: "false" }, [
    input,
    submit,
    error,
  ]);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = options.parse(input.value);
    if (value === undefined) {
      error.textContent = "This address cannot be used";
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      return;
    }
    error.hidden = true;
    input.removeAttribute("aria-invalid");
    options.onSubmit(value);
  });
  input.addEventListener("input", () => {
    error.hidden = true;
    input.removeAttribute("aria-invalid");
  });
  return form;
}

/** Sets attributes on the node a view draws, if it is still in the document. */
export function setNodeAttrs(
  editor: Editor,
  getPos: () => number | undefined,
  node: PMNode,
  attrs: Record<string, unknown>,
): void {
  const pos = getPos();
  if (typeof pos !== "number" || editor.isDestroyed) return;
  if (editor.state.doc.nodeAt(pos)?.type !== node.type) return;
  editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs }));
}

function mediaNode(name: "audio" | "video") {
  const noun = name === "audio" ? "an audio file" : "a video";
  return Node.create({
    name,
    group: "block",
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes: () => ({
      src: {
        default: null,
        parseHTML: (el) => el.querySelector(name)?.getAttribute("src") ?? null,
        renderHTML: () => ({}),
      },
      title: {
        default: null,
        parseHTML: (el) => el.querySelector("figcaption")?.textContent || null,
        renderHTML: () => ({}),
      },
      ...(name === "video"
        ? {
            poster: {
              default: null,
              parseHTML: (el: HTMLElement) =>
                el.querySelector("video")?.getAttribute("poster") ?? null,
              renderHTML: () => ({}),
            },
          }
        : {}),
    }),
    parseHTML: () => [{ tag: `figure[data-media="${name}"]` }],
    renderHTML: ({ node }) => [
      "figure",
      { "data-media": name },
      [name, { controls: "", ...(text(node.attrs["src"]) ? { src: node.attrs["src"] } : {}) }],
      ...(text(node.attrs["title"]) ? [["figcaption", {}, node.attrs["title"]]] : []),
    ],
    renderText: ({ node }) => text(node.attrs["title"]) ?? "",
    addNodeView() {
      const editor = this.editor;
      return ({ node, getPos }) => {
        let current = node;
        const dom = h("figure", {
          class: "fg-rt-media",
          "data-media": name,
          contenteditable: "false",
        });
        const render = () => {
          const src = text(current.attrs["src"]);
          const title = text(current.attrs["title"]);
          const url = editorUrl(src);
          if (!src) {
            dom.replaceChildren(
              addressForm({
                label: `Address of ${noun}`,
                placeholder: `Paste the address of ${noun}`,
                action: "Add",
                parse: (value) => safeUrl(value.trim()),
                onSubmit: (value) => setNodeAttrs(editor, getPos, current, { src: value }),
              }),
            );
            return;
          }
          if (!url) {
            dom.replaceChildren(
              h("span", { class: "fg-rt-media-note" }, ["This address is not shown"]),
            );
            return;
          }
          const poster =
            name === "video" ? safeUrl(text(current.attrs["poster"]), "image") : undefined;
          dom.replaceChildren(
            h(name, {
              src: url,
              controls: true,
              preload: name === "video" ? "metadata" : "none",
              title,
              poster,
            }),
            ...(title ? [h("figcaption", {}, [title])] : []),
          );
        };
        render();
        return {
          dom,
          update: (next) => {
            if (next.type !== current.type) return false;
            const changed =
              next.attrs["src"] !== current.attrs["src"] ||
              next.attrs["title"] !== current.attrs["title"] ||
              next.attrs["poster"] !== current.attrs["poster"];
            current = next;
            if (changed) render();
            return true;
          },
          stopEvent: (event) =>
            event.target instanceof Element && !!event.target.closest("input,button,audio,video"),
        };
      };
    },
  });
}

export const AudioNode = mediaNode("audio");
export const VideoNode = mediaNode("video");

function mediaAction(name: "audio" | "video") {
  return {
    apply: ({
      editor,
      range,
      ctx,
    }: {
      editor: Editor;
      range: { from: number; to: number } | undefined;
      ctx: Parameters<typeof uploadAvailable>[0];
    }) => {
      // With an `upload` the entry picks a file; without, it inserts a block that asks for an address.
      if (uploadAvailable(ctx)) pickFromSlash(editor, range, `${name}/*`);
      else startChain(editor, range).insertContent({ type: name }).run();
    },
    isActive: (editor: Editor) => editor.isActive(name),
  };
}

export const audio = defineEditorPlugin({
  core: audioCore,
  extensions: [AudioNode],
  blocks: { audio: mediaAction("audio") },
});

export const video = defineEditorPlugin({
  core: videoCore,
  extensions: [VideoNode],
  blocks: { video: mediaAction("video") },
});
