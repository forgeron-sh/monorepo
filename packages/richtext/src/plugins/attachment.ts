// Attachments: a file on the page, shown as a card with its kind, name and size, and a download
// link in the static view. This file also holds what the whole family shares: the upload types
// (an app provides `upload`, the package never touches the network), the pure file helpers
// (size, kind, `accept`) and the Markdown convention the family writes.
//
// Markdown: a link alone on its line whose title names the block, so every other Markdown reader
// shows an ordinary link and the title as a tooltip:
//
//   [report.pdf](https://files.example/report.pdf "attachment size=2048 type=application%2Fpdf")
//
// The title is the kind (`attachment`, `audio`, `video`, `embed`) followed by `key=value` pairs
// whose values are percent-encoded. A reader that does not know the kind keeps the link.

import { destination, unescapeMd } from "../core/markdown-kit";
import { type MarkdownReader, definePlugin } from "../core/plugin";
import type { RichNode } from "../core/types";
import { el, safeUrl } from "../core/view";

/* ================================================================== The upload flow's types */

/** What an app's `upload` function gets besides the file. */
export interface UploadContext {
  /** Aborted when the person cancels or removes the upload, or the editor goes away. */
  signal: AbortSignal;
  /** Call with a number from 0 to 1 while bytes go out. */
  onProgress(ratio: number): void;
}

/** What the app's `upload` returns: where the file now lives, and what it knows about it. */
export interface UploadResult {
  src: string;
  name?: string;
  size?: number;
  type?: string;
}

export type UploadFn = (file: File, ctx: UploadContext) => Promise<UploadResult>;

/** Why a file was not taken: its type is not accepted (or no block can hold it), or it is too big. */
export interface UploadRejection {
  file: File;
  reason: "type" | "size";
}

/** The options of the `upload` plugin, given as `pluginOptions.upload`. */
export interface UploadOptions {
  /** Sends one file; without it the family offers no upload (embeds and links by address still work). */
  upload?: UploadFn;
  /** What is accepted, as the `accept` attribute of a file input: `image/*,.pdf`. Checked on drops and pastes too. */
  accept?: string;
  /** Bytes. A bigger file is refused. */
  maxSize?: number;
  /** Hears the files that were refused and why. They are also shown as an error card. */
  onReject?: (rejections: UploadRejection[]) => void;
}

/* ================================================================== Pure file helpers */

/** "2.4 MB", "310 KB", "12 B". Same rule as the file input of the interface kit. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n >= 10 || Number.isInteger(n) ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

/** Does `file` match an `accept` list (`image/*,.pdf,application/json`)? An empty list matches. */
export function matchesAccept(file: { name: string; type: string }, accept?: string): boolean {
  const rules = (accept ?? "")
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) =>
    rule.startsWith(".")
      ? name.endsWith(rule)
      : rule.endsWith("/*")
        ? type.startsWith(rule.slice(0, -1))
        : type === rule,
  );
}

/** What a file looks like on the card: picks its icon and its badge. */
export type FileKind =
  | "image"
  | "audio"
  | "video"
  | "pdf"
  | "archive"
  | "sheet"
  | "slides"
  | "doc"
  | "code"
  | "text"
  | "file";

const BY_EXTENSION: Record<string, FileKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  svg: "image",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  m4a: "audio",
  flac: "audio",
  aac: "audio",
  mp4: "video",
  webm: "video",
  mov: "video",
  mkv: "video",
  pdf: "pdf",
  zip: "archive",
  gz: "archive",
  tar: "archive",
  rar: "archive",
  "7z": "archive",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  ods: "sheet",
  ppt: "slides",
  pptx: "slides",
  odp: "slides",
  key: "slides",
  doc: "doc",
  docx: "doc",
  odt: "doc",
  rtf: "doc",
  json: "code",
  js: "code",
  ts: "code",
  html: "code",
  css: "code",
  xml: "code",
  yml: "code",
  yaml: "code",
  txt: "text",
  md: "text",
  log: "text",
};

/** The lower-case extension of a name (`pdf` for `Report.PDF`), or `""`. */
export function fileExtension(name: string): string {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name.trim());
  return match ? (match[1] as string).toLowerCase() : "";
}

/** The kind of a file from its MIME type, else from its extension; `file` when neither says. */
export function fileKind(name: string | undefined, type: string | undefined): FileKind {
  const mime = (type ?? "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  if (/zip|compressed|x-tar|x-7z|gzip/.test(mime)) return "archive";
  if (/spreadsheet|ms-excel|text\/csv/.test(mime)) return "sheet";
  if (/presentation|ms-powerpoint/.test(mime)) return "slides";
  if (/wordprocessing|msword|rtf/.test(mime)) return "doc";
  if (/json|javascript|xml|html/.test(mime)) return "code";
  const byName = BY_EXTENSION[fileExtension(name ?? "")];
  if (byName) return byName;
  return mime.startsWith("text/") ? "text" : "file";
}

/** The block a dropped or pasted file becomes: `image`, `audio`, `video`, else `attachment`. */
export type FileBlock = "image" | "audio" | "video" | "attachment";

export function blockForFile(file: { name?: string; type?: string }): FileBlock {
  const mime = (file.type ?? "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "attachment";
}

/** The last segment of an address, decoded: a name for a file that has none. */
export function nameFromSrc(src: string): string {
  const path = src.split(/[?#]/)[0] ?? "";
  const last = path.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/** A non-empty string attribute, trimmed; anything else (a number, `null`) is nothing. */
export const textAttr = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** A size as a finite non-negative number, whatever was stored. */
export function sizeOf(value: unknown): number | undefined {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : undefined;
}

/* ================================================================== The Markdown convention */

export type LinkBlockKind = "attachment" | "audio" | "video" | "embed";

const KIND_TITLE = /^(attachment|audio|video|embed)((?: [a-z]+=\S*)*)$/;

/** `attachment size=2048 type=application%2Fpdf`: the kind, then the fields that are set. */
export function kindTitle(
  kind: LinkBlockKind,
  fields: Readonly<Record<string, string | number | undefined>>,
): string {
  const parts: string[] = [kind];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === "") continue;
    parts.push(`${key}=${encodeURIComponent(String(value))}`);
  }
  return parts.join(" ");
}

/** The inverse of `kindTitle`; `undefined` for a title that is not one of the family's. */
export function parseKindTitle(
  title: string,
): { kind: LinkBlockKind; fields: Record<string, string> } | undefined {
  const match = KIND_TITLE.exec(title.trim());
  if (!match) return undefined;
  const fields: Record<string, string> = {};
  for (const pair of (match[2] as string).trim().split(" ").filter(Boolean)) {
    const cut = pair.indexOf("=");
    try {
      fields[pair.slice(0, cut)] = decodeURIComponent(pair.slice(cut + 1));
    } catch {
      fields[pair.slice(0, cut)] = pair.slice(cut + 1);
    }
  }
  return { kind: match[1] as LinkBlockKind, fields };
}

const LINK_LINE = /^\[((?:\\.|[^\]])*)\]\((.*)\)\s*$/;

/** Writes a link-shaped block: `[label](src "kind field=value")`. */
export function writeKindLink(
  label: string,
  src: string,
  title: string,
  escape: (text: string) => string,
  escapeUrl: (url: string) => string,
): string {
  return `[${escape(label)}](${escapeUrl(src)} "${title}")`;
}

/**
 * The reader of the whole family: one line that is only a link whose title names a block of the
 * family, read as that block when its plugin is in the list. Every plugin of the family carries
 * the same reader (they count once), so any subset of them reads what it can.
 */
export const kindLinkReader = {
  id: "attachments-link",
  priority: 45,
  read: (lines: string[], at: number, reader: MarkdownReader) => {
    const match = LINK_LINE.exec(lines[at] as string);
    if (!match) return undefined;
    const whole = `(${match[2]})`;
    const dest = destination(whole, 0);
    if (!dest || dest.end !== whole.length || dest.title === undefined) return undefined;
    const parsed = parseKindTitle(dest.title);
    if (!parsed || !reader.has(parsed.kind)) return undefined;
    const label = unescapeMd(match[1] as string);
    const node = readLinkBlock(parsed.kind, label, dest.url, parsed.fields);
    return node ? { nodes: [node], next: at + 1 } : undefined;
  },
};

function readLinkBlock(
  kind: LinkBlockKind,
  label: string,
  url: string,
  fields: Record<string, string>,
): RichNode | undefined {
  const attrs: Record<string, unknown> = {};
  switch (kind) {
    case "attachment": {
      attrs["src"] = url;
      attrs["name"] = label || nameFromSrc(url);
      const size = sizeOf(fields["size"]);
      if (size !== undefined) attrs["size"] = size;
      if (fields["type"]) attrs["type"] = fields["type"];
      break;
    }
    case "audio":
    case "video":
      attrs["src"] = url;
      // A label that is only the file name (what is written when there is no caption) is no caption.
      if (label && label !== nameFromSrc(url)) attrs["title"] = label;
      if (kind === "video" && fields["poster"]) attrs["poster"] = fields["poster"];
      break;
    case "embed":
      attrs["url"] = url;
      if (label && label !== url) attrs["title"] = label;
      if (fields["description"]) attrs["description"] = fields["description"];
      if (fields["image"]) attrs["image"] = fields["image"];
      break;
  }
  return { type: kind, attrs };
}

/* ================================================================== The attachment block */

interface AttachmentData {
  src: string | undefined;
  name: string;
  size: number | undefined;
  type: string | undefined;
}

const readAttachment = (node: RichNode): AttachmentData | undefined => {
  const src = textAttr(node.attrs?.["src"]);
  const name = textAttr(node.attrs?.["name"]) ?? (src ? nameFromSrc(src) : "");
  if (!src && !name) return undefined;
  return {
    src,
    name: name || "File",
    size: sizeOf(node.attrs?.["size"]),
    type: textAttr(node.attrs?.["type"]),
  };
};

export const attachment = definePlugin({
  id: "attachment",
  name: "File",
  description:
    "A file on the page as a card with its kind, name and size. Uploaded through the app's `upload`.",
  nodes: {
    attachment: {
      markdown: (node, w) => {
        const data = readAttachment(node);
        if (!data) return "";
        if (!data.src) return w.escape(data.name);
        return writeKindLink(
          data.name,
          data.src,
          kindTitle("attachment", { size: data.size, type: data.type }),
          w.escape,
          w.escapeUrl,
        );
      },
      text: (node) => readAttachment(node)?.name ?? "",
      render: (node) => {
        const data = readAttachment(node);
        if (!data) return [];
        const kind = fileKind(data.name, data.type);
        const href = safeUrl(data.src);
        const ext = fileExtension(data.name);
        const body = [
          el("span", { class: "fg-rt-file-badge" }, [(ext || kind).toUpperCase()]),
          el("span", { class: "fg-rt-file-name" }, [data.name]),
          ...(data.size !== undefined
            ? [el("span", { class: "fg-rt-file-size" }, [formatFileSize(data.size)])]
            : []),
        ];
        return [
          el("div", { class: "fg-rt-file", "data-kind": kind }, [
            href
              ? el(
                  "a",
                  {
                    class: "fg-rt-file-link",
                    href,
                    download: data.name,
                    rel: "noopener noreferrer",
                  },
                  body,
                )
              : el("span", { class: "fg-rt-file-link" }, body),
          ]),
        ];
      },
    },
  },
  blocks: [
    {
      id: "file",
      label: "File",
      keywords: ["attachment", "upload", "document", "pdf", "download", "attach"],
      icon: "attachment",
      group: "insert",
    },
  ],
  markdown: { blocks: [kindLinkReader] },
});

/** The upload flow as a plugin: it owns no node, the editor half does the work. */
export const upload = definePlugin({
  id: "upload",
  name: "Upload",
  description:
    "Drop and paste files, a file picker in the slash menu, and a card with progress while the app's `upload` runs.",
});
