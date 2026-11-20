// Attachments, editor half: the `attachment` node drawn as a file card (pixel icon by file kind,
// name, size, a download link), and the "File" entry of the slash menu, which opens the file
// picker of the upload flow. The entry is offered only when the app gave an `upload` function.

import { Node } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Download03Icon } from "@forgeron/icons";
import { defineEditorPlugin } from "../../tiptap/plugin";
import {
  attachment as attachmentCore,
  fileKind,
  formatFileSize,
  nameFromSrc,
  sizeOf,
} from "../attachment";
import { editorUrl, h, iconElement, kindIcon, pickFromSlash, uploadAvailable } from "./upload";

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** The file card of a node, and how to refresh it when the node's attributes change. */
function fileCard(initial: PMNode) {
  const icon = h("span", { class: "fg-rt-file-icon" });
  const name = h("span", { class: "fg-rt-file-name" });
  const size = h("span", { class: "fg-rt-file-size" });
  const meta = h("span", { class: "fg-rt-file-meta" }, [name, size]);
  const link = h(
    "a",
    {
      class: "fg-rt-file-download",
      rel: "noopener noreferrer",
      target: "_blank",
    },
    [iconElement(Download03Icon)],
  );
  const dom = h("div", { class: "fg-rt-file", contenteditable: "false" }, [icon, meta, link]);
  let kind: string | undefined;
  const render = (node: PMNode) => {
    const src = text(node.attrs["src"]);
    const label = text(node.attrs["name"]) ?? (src ? nameFromSrc(src) : "File");
    const bytes = sizeOf(node.attrs["size"]);
    const next = fileKind(label, text(node.attrs["type"]));
    if (next !== kind) {
      kind = next;
      icon.replaceChildren(iconElement(kindIcon(next)));
    }
    dom.dataset["kind"] = next;
    name.textContent = label;
    size.textContent = bytes === undefined ? "" : formatFileSize(bytes);
    const href = editorUrl(src);
    if (href) {
      link.setAttribute("href", href);
      link.setAttribute("download", label);
      link.hidden = false;
    } else {
      link.removeAttribute("href");
      link.hidden = true;
    }
    link.setAttribute("aria-label", `Download ${label}`);
  };
  render(initial);
  return { dom, render };
}

export const AttachmentNode = Node.create({
  name: "attachment",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes: () => ({
    src: {
      default: null,
      parseHTML: (el) => el.getAttribute("data-src"),
      renderHTML: (attrs) => (attrs["src"] ? { "data-src": attrs["src"] } : {}),
    },
    name: {
      default: null,
      parseHTML: (el) => el.getAttribute("data-name"),
      renderHTML: (attrs) => (attrs["name"] ? { "data-name": attrs["name"] } : {}),
    },
    size: {
      default: null,
      parseHTML: (el) => sizeOf(el.getAttribute("data-size")) ?? null,
      renderHTML: (attrs) => (attrs["size"] != null ? { "data-size": String(attrs["size"]) } : {}),
    },
    type: {
      default: null,
      parseHTML: (el) => el.getAttribute("data-type-mime"),
      renderHTML: (attrs) => (attrs["type"] ? { "data-type-mime": attrs["type"] } : {}),
    },
  }),
  parseHTML: () => [{ tag: "div[data-attachment]" }],
  renderHTML: ({ node, HTMLAttributes }) => [
    "div",
    { "data-attachment": "", ...HTMLAttributes },
    text(node.attrs["name"]) ?? "File",
  ],
  renderText: ({ node }) => text(node.attrs["name"]) ?? "",
  addNodeView:
    () =>
    ({ node }) => {
      const card = fileCard(node);
      let current = node;
      return {
        dom: card.dom,
        update: (next) => {
          if (next.type !== current.type) return false;
          current = next;
          card.render(next);
          return true;
        },
        stopEvent: (event) => event.target instanceof Element && !!event.target.closest("a"),
      };
    },
});

export const attachment = defineEditorPlugin({
  core: attachmentCore,
  extensions: [AttachmentNode],
  blocks: {
    file: {
      available: uploadAvailable,
      apply: ({ editor, range }) => pickFromSlash(editor, range),
      isActive: (editor) => editor.isActive("attachment"),
    },
  },
});
