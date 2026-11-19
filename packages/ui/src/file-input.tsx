// Files to send: a button and a drop target for choosing them, the list of what was chosen with a
// way to remove each, and the limits (type, size, number) checked before anything leaves.

import { AttachmentIcon, Cancel01Icon } from "@forgeron/icons";
import type { DragEvent } from "react";
import { useId, useRef, useState } from "react";
import { Button } from "./button";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";

export interface FileRejection {
  file: File;
  reason: "type" | "size" | "count";
}

export interface FileInputProps {
  /** Names the field, e.g. "Attachments". */
  label: string;
  value?: File[];
  defaultValue?: File[];
  onChange?: (files: File[]) => void;
  /** What the browser accepts, as the `accept` attribute: `image/*,.pdf`. Checked on a drop too. */
  accept?: string;
  /** Several files; one chosen replaces the one before. Default `false`. */
  multiple?: boolean;
  /** Bytes. A bigger file is refused. */
  maxSize?: number;
  /** At most this many files in the list (with `multiple`). */
  maxFiles?: number;
  /** Hears the files that were refused and why, to tell the person. */
  onReject?: (rejections: FileRejection[]) => void;
  /** The line in the drop target. Default "Drop files here, or". */
  hint?: string;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string | undefined;
  className?: string;
}

/** "2.4 MB", "310 KB", "12 B". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
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

/**
 * Choose files with the button (Enter or Space) or drop them on the frame. Each file in the list
 * has a remove button. Limits are checked here; `onReject` hears what was refused.
 */
export function FileInput({
  label,
  value,
  defaultValue = [],
  onChange,
  accept,
  multiple,
  maxSize,
  maxFiles,
  onReject,
  hint = "Drop files here, or",
  disabled,
  id,
  className,
  ...aria
}: FileInputProps) {
  const [files, setFiles] = useControllableState<File[]>({ value, defaultValue, onChange });
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const take = (incoming: File[]) => {
    const rejected: FileRejection[] = [];
    const kept: File[] = [];
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) rejected.push({ file, reason: "type" });
      else if (maxSize !== undefined && file.size > maxSize)
        rejected.push({ file, reason: "size" });
      else kept.push(file);
    }
    let next = multiple ? [...files, ...kept] : kept.slice(0, 1);
    if (!multiple && kept.length === 0) next = files;
    if (maxFiles !== undefined && next.length > maxFiles) {
      for (const file of next.slice(maxFiles)) {
        if (kept.includes(file)) rejected.push({ file, reason: "count" });
      }
      next = next.slice(0, maxFiles);
    }
    if (next.length !== files.length || next.some((f, i) => f !== files[i])) setFiles(next);
    if (rejected.length > 0) onReject?.(rejected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    if (disabled) return;
    take([...event.dataTransfer.files]);
  };

  return (
    <div className={cx("fg-file", className)}>
      <div
        className={cx("fg-file-drop", over && "fg-file-over", disabled && "fg-combo-disabled")}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={input}
          id={id}
          {...aria}
          type="file"
          className="fg-sr"
          tabIndex={-1}
          aria-label={label}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            take([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
        <span className="fg-file-hint">{hint}</span>
        <Button size="sm" disabled={disabled} onClick={() => input.current?.click()}>
          <Icon icon={AttachmentIcon} size={12} variant="mono" />
          {multiple ? "Choose files" : "Choose a file"}
        </Button>
        {maxSize !== undefined || accept ? (
          <span className="fg-file-limits">
            {[
              accept?.replace(/,/g, ", "),
              maxSize !== undefined ? `up to ${formatFileSize(maxSize)}` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        ) : null}
      </div>
      {files.length > 0 ? (
        <ul className="fg-file-list" id={listId} aria-label={`${label}, chosen`}>
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="fg-file-row">
              <Icon icon={AttachmentIcon} size={12} variant="mono" />
              <span className="fg-file-name">{file.name}</span>
              <span className="fg-file-size">{formatFileSize(file.size)}</span>
              <button
                type="button"
                className="fg-combo-chip-x"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
              >
                <Icon icon={Cancel01Icon} size={12} variant="mono" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
