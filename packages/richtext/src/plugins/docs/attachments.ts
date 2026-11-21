// The documentation of the attachments family as data: one entry per plugin, for a catalog (the
// site, the gallery) to list the same way as every other plugin. No React, no Tiptap.

import type { PluginDoc } from "./types";

const SETUP = `import { RichTextEditor } from "@forgeron/richtext/react";
import { fullEditorPlugins } from "@forgeron/richtext/plugins/editor";
import { attachmentsPlugins } from "@forgeron/richtext/plugins/editor/embed";

const plugins = [...fullEditorPlugins, ...attachmentsPlugins]; // module scope: a new list rebuilds the editor
const options = {
  upload: {
    upload: async (file, { signal, onProgress }) => {
      const sent = await myStorage.put(file, { signal, onProgress });
      return { src: sent.url };
    },
    accept: "image/*,audio/*,video/*,.pdf",
    maxSize: 25 * 1024 * 1024,
  },
  embed: { resolveEmbed: (url) => myLinks.preview(url) },
};

<RichTextEditor plugins={plugins} pluginOptions={options} defaultValue={doc} />;`;

const UPLOAD_OPTIONS = [
  {
    name: "pluginOptions.upload.upload",
    type: "(file: File, ctx: { signal: AbortSignal; onProgress(ratio: number): void }) => Promise<{ src: string; name?: string; size?: number; type?: string }>",
    description:
      "Sends one file and says where it now lives. The package makes no request: this is the app's storage. Without it drops, pastes and the File entry do nothing and the Audio and Video entries ask for an address instead.",
  },
  {
    name: "pluginOptions.upload.accept",
    type: "string",
    description:
      "What is accepted, as the `accept` attribute of a file input (`image/*,.pdf`). Checked for the picker, drops and pastes; a refused file shows an error card.",
    default: "everything",
  },
  {
    name: "pluginOptions.upload.maxSize",
    type: "number",
    description: "Bytes. A bigger file is refused, with an error card.",
    default: "no limit",
  },
  {
    name: "pluginOptions.upload.onReject",
    type: "(rejections: { file: File; reason: 'type' | 'size' }[]) => void",
    description: "Hears the files that were refused and why, to tell the person another way too.",
    default: "none",
  },
] as const;

export const attachmentsDocs: PluginDoc[] = [
  {
    id: "upload",
    family: "attachments",
    name: "Upload",
    summary:
      "Drop or paste files on the editor, pick them from the slash menu, and see a card with progress, Cancel, Retry and Remove while the app's upload runs.",
    core: "@forgeron/richtext/plugins/attachment",
    editor: "@forgeron/richtext/plugins/editor/upload",
    options: UPLOAD_OPTIONS,
    notes: [
      "A file becomes the block that fits its MIME type: image/* an image, audio/* an audio, video/* a video, anything else an attachment. A block whose plugin is not in the list falls back to an attachment; with no attachment either, the file is refused.",
      "A pending upload is never part of the document. It is a widget of the editor view anchored to a position that follows the edits around it, so `onChange`, `getJSON()` and a shared Y.Doc never hold a placeholder, and nothing half-done is saved. The real block is inserted in one transaction when the upload ends.",
      "Collaboration: a pending upload is local to the person who started it. In a shared document its anchor is a Yjs relative position, so it follows the other people's edits; they only see the block once it is done.",
      "A failed or cancelled upload stays on screen, in this editor only, with Retry and Remove. A refused file (type, size) has Remove only. Closing the page or leaving the editor loses the cards: nothing is saved for them.",
      "Several files dropped together are uploaded in parallel and each lands at its own anchor, in the order they were dropped when they end in that order; a file that ends first lands first.",
      "Paste: files are taken only when the clipboard holds no text (a spreadsheet copied as text also carries a picture of itself).",
      "The progress bar needs the app to call `onProgress`; without it the card shows `Uploading` until the end.",
      "Opening the file dialog needs a user gesture: the slash entry is one. Not verified here: dragging real files from the operating system, a screen reader, touch.",
    ],
    usage: SETUP,
  },
  {
    id: "attachment",
    family: "attachments",
    name: "File",
    summary:
      "A file on the page as a card: a pixel icon by file kind, the name, the size and a download link.",
    core: "@forgeron/richtext/plugins/attachment",
    editor: "@forgeron/richtext/plugins/editor/attachment",
    options: [
      {
        name: "node attrs",
        type: "{ src: string; name?: string; size?: number; type?: string }",
        description:
          "`src` is the address, `name` the label, `size` bytes, `type` the MIME type. A missing name is taken from the address; a missing `src` shows the name without a link.",
      },
      {
        name: "slash entry",
        type: '"File"',
        description:
          "Opens the file dialog of the upload flow. Offered only when `pluginOptions.upload.upload` is given.",
      },
    ],
    markdown: `[report.pdf](https://files.example/report.pdf "attachment size=2048 type=application%2Fpdf")`,
    notes: [
      "Markdown: a link alone on its line whose title starts with `attachment`, then `key=value` pairs (percent-encoded). Other Markdown readers show an ordinary link with the title as a tooltip.",
      "Plain text writes the name. The static view links only http, https, mailto, tel and relative addresses; any other scheme gives a card with the name and no link.",
      "The static view shows the extension as a text badge: the pixel icons are drawn by the editor.",
      "Not in `fullCorePlugins`: pass `attachmentsCorePlugins` (`@forgeron/richtext/plugins/embed`) with the others to `toMarkdown`, `fromMarkdown`, `toPlainText` and `RichTextView`.",
    ],
    usage: `import { toMarkdown } from "@forgeron/richtext";
import { fullCorePlugins } from "@forgeron/richtext/plugins";
import { attachmentsCorePlugins } from "@forgeron/richtext/plugins/embed";

const cores = [...fullCorePlugins, ...attachmentsCorePlugins];
const doc = {
  type: "doc",
  content: [
    { type: "attachment", attrs: { src: "/files/report.pdf", name: "report.pdf", size: 2048, type: "application/pdf" } },
  ],
};
toMarkdown(doc, cores);
// [report.pdf](/files/report.pdf "attachment size=2048 type=application%2Fpdf")`,
  },
  {
    id: "audio",
    family: "attachments",
    name: "Audio",
    summary: "A sound block with the browser's own controls and an optional caption.",
    core: "@forgeron/richtext/plugins/media",
    editor: "@forgeron/richtext/plugins/editor/media",
    options: [
      {
        name: "node attrs",
        type: "{ src: string; title?: string }",
        description: "`src` is the address, `title` a caption shown under the player.",
      },
      {
        name: "slash entry",
        type: '"Audio"',
        description:
          "With an `upload` it opens the file dialog (audio files); without it inserts a block that asks for an address.",
      },
    ],
    markdown: `[Interview](https://files.example/interview.mp3 "audio")`,
    notes: [
      'Markdown: `[title](src "audio")`; other readers show a link.',
      "The caption is set from the file name on upload, or in the JSON; the editor has no caption field.",
      'The static view renders `<audio controls preload="none">` and drops the block when the address has an unsafe scheme.',
    ],
    usage: SETUP,
  },
  {
    id: "video",
    family: "attachments",
    name: "Video",
    summary: "A video block with the browser's controls, an optional caption and a poster picture.",
    core: "@forgeron/richtext/plugins/media",
    editor: "@forgeron/richtext/plugins/editor/media",
    options: [
      {
        name: "node attrs",
        type: "{ src: string; title?: string; poster?: string }",
        description:
          "`poster` is the picture shown before play (http, https, relative or a data image).",
      },
      {
        name: "slash entry",
        type: '"Video"',
        description:
          "With an `upload` it opens the file dialog (video files); without it inserts a block that asks for an address.",
      },
    ],
    markdown: `[Demo](https://files.example/demo.mp4 "video poster=https%3A%2F%2Ffiles.example%2Fdemo.jpg")`,
    notes: [
      'Markdown: `[title](src "video poster=...")`; the poster is percent-encoded in the title.',
      'The static view renders `<video controls preload="metadata">`; an unsafe poster is left out, an unsafe source drops the block.',
      "An uploaded video gets no poster: the app sets one in the JSON if it makes thumbnails.",
    ],
    usage: SETUP,
  },
  {
    id: "embed",
    family: "attachments",
    name: "Embed",
    summary: "A link with a preview: a bookmark card with a title, a description and a picture.",
    core: "@forgeron/richtext/plugins/embed",
    editor: "@forgeron/richtext/plugins/editor/embed",
    options: [
      {
        name: "pluginOptions.embed.resolveEmbed",
        type: "(url: string, signal?: AbortSignal) => Promise<{ title?: string; description?: string; image?: string }>",
        description:
          "Asks the app what an address points at. Called once, by the person who inserts the block, and the answer is written into the block; nobody else asks again. The package makes no request.",
        default: "none: the card shows the address",
      },
      {
        name: "node attrs",
        type: "{ url: string; title?: string; description?: string; image?: string }",
        description:
          "What the card shows. Strings from `resolveEmbed` are trimmed (title 300, description 1000) and a picture must be a safe address.",
      },
    ],
    markdown: `[Example site](https://example.com "embed description=A%20short%20summary image=https%3A%2F%2Fexample.com%2Fcard.png")`,
    notes: [
      'Markdown: `[title](url "embed description=... image=...")`; without a title the link text is the address.',
      "The static view links only http, https, mailto, tel and relative addresses (the same rule as links); an unsafe address gives a card without a link, and its picture must be http, https, relative or a data image.",
      "A failed `resolveEmbed` leaves the card with the address and a `No preview available` note, in this editor only.",
      "`attachmentsPlugins` (editor) and `attachmentsCorePlugins` (core) list the whole family; neither is part of the `full` presets.",
    ],
    usage: SETUP,
  },
];
