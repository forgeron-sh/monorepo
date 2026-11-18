// The parts the Drive blocks share: the kinds of file and their pixel marks, sizes and dates
// written for people, the drag payload a file carries from a list to a folder, and the block bar
// that draws progress and usage in whole cells.

import type { IconDefinition } from "@forgeron/icons";
import {
  Archive01Icon,
  CodeIcon,
  File01Icon,
  Film01Icon,
  Folder01Icon,
  Image01Icon,
  Layout01Icon,
  MusicNote01Icon,
  Note01Icon,
  TableIcon,
  TextAlignLeftIcon,
} from "@forgeron/icons";
import type { CSSProperties } from "react";
import { cx } from "../cx";
import { formatShort } from "../dates";
import { Icon } from "../icon";

/** What a file is, for its mark, its thumbnail and its preview. */
export type FileKind =
  | "folder"
  | "pdf"
  | "image"
  | "sheet"
  | "doc"
  | "text"
  | "slides"
  | "video"
  | "audio"
  | "archive"
  | "code"
  | "other";

export interface FileKindInfo {
  /** Said and written: "Spreadsheet". */
  label: string;
  icon: IconDefinition;
  /** The colour of the mark, a token. */
  tone: string;
}

/** The label, the pixel icon and the colour of each kind of file. */
export const FILE_KINDS: Readonly<Record<FileKind, FileKindInfo>> = {
  folder: { label: "Folder", icon: Folder01Icon, tone: "var(--ink-muted)" },
  pdf: { label: "PDF", icon: File01Icon, tone: "var(--danger)" },
  image: { label: "Image", icon: Image01Icon, tone: "var(--ink)" },
  sheet: { label: "Spreadsheet", icon: TableIcon, tone: "var(--success)" },
  doc: { label: "Document", icon: TextAlignLeftIcon, tone: "var(--ink)" },
  text: { label: "Text", icon: Note01Icon, tone: "var(--ink-muted)" },
  slides: { label: "Presentation", icon: Layout01Icon, tone: "var(--warning)" },
  video: { label: "Video", icon: Film01Icon, tone: "var(--accent)" },
  audio: { label: "Audio", icon: MusicNote01Icon, tone: "var(--ink-muted)" },
  archive: { label: "Archive", icon: Archive01Icon, tone: "var(--ink-dim)" },
  code: { label: "Code", icon: CodeIcon, tone: "var(--ink-muted)" },
  other: { label: "File", icon: File01Icon, tone: "var(--ink-dim)" },
};

const EXTENSIONS: ReadonlyArray<[RegExp, FileKind]> = [
  [/^pdf$/, "pdf"],
  [/^(png|jpe?g|gif|webp|avif|heic|svg|bmp|tiff?)$/, "image"],
  [/^(xlsx?|csv|tsv|ods|numbers)$/, "sheet"],
  [/^(docx?|odt|pages|rtf)$/, "doc"],
  [/^(md|markdown|txt|log)$/, "text"],
  [/^(pptx?|key|odp)$/, "slides"],
  [/^(mp4|mov|webm|mkv|avi)$/, "video"],
  [/^(mp3|wav|ogg|flac|m4a|aac)$/, "audio"],
  [/^(zip|rar|7z|tar|gz|tgz|bz2)$/, "archive"],
  [/^(js|jsx|ts|tsx|json|ya?ml|toml|html?|css|py|rb|go|rs|sh|sql)$/, "code"],
];

/** The kind of a file from its name: `Q3 report.pdf` is a `pdf`, an unknown extension is `other`. */
export function fileKindOf(name: string): FileKind {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return "other";
  const ext = name.slice(dot + 1).toLowerCase();
  return EXTENSIONS.find(([re]) => re.test(ext))?.[1] ?? "other";
}

/** A size for people, in powers of 1000: `840 B`, `12.4 KB`, `3.1 MB`, `1.2 GB`; a dash when unknown. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return "—";
  if (bytes < 1000) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/**
 * A date and time `YYYY-MM-DD HH:mm` (or a date alone) for a dense row: the time when it is
 * `today`, else the day, with the year when it is not this year's.
 */
export function formatWhen(value: string | undefined, today?: string): string {
  if (!value) return "—";
  const [day, time] = value.split(/[ T]/);
  if (!day) return value;
  if (today && day === today) return time ? time.slice(0, 5) : "Today";
  const year = today ? Number(today.slice(0, 4)) : undefined;
  return formatShort(day, year);
}

/** The data type a file carries while it is dragged inside the Drive blocks: its ids as JSON. */
export const DRIVE_DRAG_TYPE = "application/x-forgeron-drive";

/** What a folder receives on a drop: files moved from a list, files from the computer. */
export interface DriveDrop {
  /** Ids of the items dragged from a `FileBrowser` (or anything that sets `DRIVE_DRAG_TYPE`). */
  ids: string[];
  /** Files dropped from the computer. */
  files: File[];
}

const hasType = (dt: DataTransfer | null, type: string) =>
  !!dt && Array.from(dt.types ?? []).includes(type);

/** Whether a drag carries Drive items or files: only then does a folder light up. */
export function isDriveDrag(dt: DataTransfer | null): boolean {
  return hasType(dt, DRIVE_DRAG_TYPE) || hasType(dt, "Files");
}

/** The ids and files of a drop. */
export function readDriveDrop(dt: DataTransfer | null): DriveDrop {
  if (!dt) return { ids: [], files: [] };
  let ids: string[] = [];
  const raw = hasType(dt, DRIVE_DRAG_TYPE) ? dt.getData(DRIVE_DRAG_TYPE) : "";
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) ids = parsed.filter((x): x is string => typeof x === "string");
    } catch {
      ids = [];
    }
  }
  return { ids, files: Array.from(dt.files ?? []) };
}

export interface FileTypeMarkProps {
  /** The kind, for the icon and the colour; `fileKindOf(name)` finds it from a name. */
  kind: FileKind;
  /** Another icon in place of the kind's: a team drive, an app's folder. */
  icon?: IconDefinition;
  /** Another colour, a token: `var(--accent)` for a shared drive. */
  tone?: string;
  /** `sm` 22px in a row, `lg` 40px in a header, `xl` 64px, unframed, on a preview. */
  size?: "sm" | "lg" | "xl";
  /** Names the mark when it stands without the file's name; decorative otherwise. */
  label?: string;
  className?: string;
}

/** The square mark of a file's kind: its pixel icon in its colour, framed. */
export function FileTypeMark({
  kind,
  icon,
  tone,
  size = "sm",
  label,
  className,
}: FileTypeMarkProps) {
  const info = FILE_KINDS[kind];
  const px = size === "xl" ? 36 : size === "lg" ? 24 : 12;
  return (
    <span
      className={cx("fg-ftype", size !== "sm" && `fg-ftype-${size}`, className)}
      style={{ "--fg-ftype-tone": tone ?? info.tone } as CSSProperties}
      title={info.label}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <Icon icon={icon ?? info.icon} size={px} variant="mono" />
    </span>
  );
}

export type BlockTone = "accent" | "ink" | "muted" | "success" | "warning" | "danger";

/** One run of lit cells of a block bar. */
export interface BlockRun {
  /** Between 0 and 1 of the whole bar. */
  ratio: number;
  tone?: BlockTone;
}

/**
 * A row of square cells lit from the left, in one tone or in several runs: progress and usage
 * drawn in whole blocks. Decorative: the figure is always written next to it.
 */
export function BlockBar({
  runs,
  cells = 30,
  className,
}: {
  runs: ReadonlyArray<BlockRun>;
  cells?: number;
  className?: string;
}) {
  const tones: Array<BlockTone | null> = [];
  for (const run of runs) {
    const lit = Math.round(Math.min(Math.max(run.ratio, 0), 1) * cells);
    // A run that exists shows at least one cell.
    const n = run.ratio > 0 ? Math.max(1, lit) : 0;
    for (let i = 0; i < n && tones.length < cells; i++) tones.push(run.tone ?? "accent");
  }
  while (tones.length < cells) tones.push(null);
  return (
    <span className={cx("fg-blockbar", className)} aria-hidden="true">
      {tones.map((tone, i) => (
        <i key={i} className={tone ? `fg-blockbar-${tone}` : undefined} />
      ))}
    </span>
  );
}
