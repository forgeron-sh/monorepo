// Files to send: a button and a drop target for choosing them, the list of what was chosen with a
// way to remove each, and the limits (type, size, number) checked before anything leaves.
// `FileInput` is the props form; `FileInputDrop`, `FileInputHint`, `FileInputTrigger`,
// `FileInputLimits`, `FileInputList` and `FileInputItem` are the parts it is built from.
// `DropZone` is the sibling for a drop area with no list; it imports `matchesAccept` from here,
// so these parts keep their own drop handling (a cycle between the two files is not allowed).

import { AttachmentIcon, Cancel01Icon } from "@forgeron/icons";
import type { ComponentProps, DragEvent, ReactNode } from "react";
import { createContext, useContext, useId, useState } from "react";
import { Button } from "./button";
import { cx } from "./cx";
import { formatBytes } from "./format";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";

export interface FileRejection {
  file: File;
  reason: "type" | "size" | "count";
}

export interface FileInputProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue" | "children" | "className" | "id" | "aria-describedby"
> {
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
  /** Stays undefined: with children, `FileInput` is the root of the parts. */
  children?: undefined;
}

/** The root of the parts: the same props but `hint`, with the parts as children. */
export type FileInputRootProps = Omit<FileInputProps, "hint" | "children"> & {
  children: ReactNode;
};

/** "2.4 MB", "310 KB", "12 B": a file's size, in powers of 1024 (see `formatBytes`). */
export const formatFileSize = (bytes: number): string => formatBytes(bytes, { base: 1024 });

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

interface FileState {
  label: string;
  files: File[];
  setFiles: (files: File[]) => void;
  take: (incoming: File[]) => void;
  over: boolean;
  setOver: (over: boolean) => void;
  disabled: boolean | undefined;
  multiple: boolean | undefined;
  accept: string | undefined;
  maxSize: number | undefined;
  inputId: string | undefined;
  describedBy: string | undefined;
  /** Ref callback of the hidden file input. */
  attach: (el: HTMLInputElement | null) => void;
  /** Opens the file chooser. */
  open: () => void;
  listId: string;
}

const FileContext = createContext<FileState | null>(null);

function useFile(): FileState {
  const state = useContext(FileContext);
  if (!state) throw new Error("FileInput parts go inside <FileInput>.");
  return state;
}

/** The files chosen so far and what to do with them, from inside a `FileInput`. */
export function useFileInput(): {
  files: File[];
  remove: (index: number) => void;
  clear: () => void;
  open: () => void;
} {
  const f = useFile();
  return {
    files: f.files,
    remove: (index) => f.setFiles(f.files.filter((_, j) => j !== index)),
    clear: () => f.setFiles([]),
    open: f.open,
  };
}

/**
 * Choose files with the button (Enter or Space) or drop them on the frame. Each file in the list
 * has a remove button. Limits are checked here; `onReject` hears what was refused. With children
 * it is the root of the parts; without, it draws the frame, the button and the list.
 */
export function FileInput(props: FileInputProps | FileInputRootProps) {
  if (props.children !== undefined) return <FileInputRoot {...(props as FileInputRootProps)} />;
  const { hint = "Drop files here, or", children: _none, ...rest } = props as FileInputProps;
  return (
    <FileInputRoot {...rest}>
      <FileInputDrop>
        <FileInputHint>{hint}</FileInputHint>
        <FileInputTrigger />
        <FileInputLimits />
      </FileInputDrop>
      <FileInputList />
    </FileInputRoot>
  );
}

function FileInputRoot({
  label,
  value,
  defaultValue = [],
  onChange,
  accept,
  multiple,
  maxSize,
  maxFiles,
  onReject,
  disabled,
  id,
  className,
  children,
  "aria-describedby": ariaDescribedBy,
  ...rest
}: FileInputRootProps) {
  const [files, setFiles] = useControllableState<File[]>({ value, defaultValue, onChange });
  const [over, setOver] = useState(false);
  const [input, setInput] = useState<HTMLInputElement | null>(null);
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

  const state: FileState = {
    label,
    files,
    setFiles,
    take,
    over,
    setOver,
    disabled,
    multiple,
    accept,
    maxSize,
    inputId: id,
    describedBy: ariaDescribedBy,
    attach: setInput,
    open: () => input?.click(),
    listId,
  };
  return (
    <FileContext.Provider value={state}>
      <div data-slot="file-input" {...rest} className={cx("fg-file", className)}>
        {children}
      </div>
    </FileContext.Provider>
  );
}

/** The dashed frame: files dropped on it are taken; it holds the hidden file input. */
export function FileInputDrop({ className, children, ...rest }: ComponentProps<"div">) {
  const f = useFile();
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    rest.onDrop?.(event);
    event.preventDefault();
    f.setOver(false);
    if (f.disabled) return;
    f.take([...event.dataTransfer.files]);
  };
  return (
    <div
      data-slot="file-input-drop"
      {...rest}
      className={cx(
        "fg-file-drop",
        f.over && "fg-file-over",
        f.disabled && "fg-combo-disabled",
        className,
      )}
      onDragOver={(event) => {
        rest.onDragOver?.(event);
        event.preventDefault();
        if (!f.disabled) f.setOver(true);
      }}
      onDragLeave={(event) => {
        rest.onDragLeave?.(event);
        f.setOver(false);
      }}
      onDrop={onDrop}
    >
      <input
        ref={(el) => f.attach(el)}
        id={f.inputId}
        aria-describedby={f.describedBy}
        type="file"
        className="fg-sr"
        tabIndex={-1}
        aria-label={f.label}
        accept={f.accept}
        multiple={f.multiple}
        disabled={f.disabled}
        onChange={(event) => {
          f.take([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
      {children}
    </div>
  );
}

/** The line in the frame: "Drop files here, or". */
export function FileInputHint({ className, ...rest }: ComponentProps<"span">) {
  return <span data-slot="file-input-hint" {...rest} className={cx("fg-file-hint", className)} />;
}

export type FileInputTriggerProps = Omit<ComponentProps<"button">, "onClick" | "className"> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
};

/** The button that opens the file chooser. Default text: "Choose a file" or "Choose files". */
export function FileInputTrigger({ children, ...rest }: FileInputTriggerProps) {
  const f = useFile();
  return (
    <Button
      size="sm"
      disabled={f.disabled}
      onClick={f.open}
      data-slot="file-input-trigger"
      {...rest}
    >
      {rest.asChild ? (
        children
      ) : (
        <>
          <Icon icon={AttachmentIcon} size={12} variant="mono" />
          {children ?? (f.multiple ? "Choose files" : "Choose a file")}
        </>
      )}
    </Button>
  );
}

/** What is allowed: the types and the size. Shows nothing when there are no limits and no text. */
export function FileInputLimits({ className, children, ...rest }: ComponentProps<"span">) {
  const f = useFile();
  const text =
    children ??
    [
      f.accept?.replace(/,/g, ", "),
      f.maxSize !== undefined ? `up to ${formatFileSize(f.maxSize)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  if (!text) return null;
  return (
    <span data-slot="file-input-limits" {...rest} className={cx("fg-file-limits", className)}>
      {text}
    </span>
  );
}

export type FileInputListProps = Omit<ComponentProps<"ul">, "children"> & {
  /** One row per file, in place of `FileInputItem`. */
  children?: (file: File, index: number) => ReactNode;
};

/** The files chosen, one row each. Draws nothing while the list is empty. */
export function FileInputList({ className, children, ...rest }: FileInputListProps) {
  const f = useFile();
  if (f.files.length === 0) return null;
  return (
    <ul
      id={f.listId}
      aria-label={`${f.label}, chosen`}
      data-slot="file-input-list"
      {...rest}
      className={cx("fg-file-list", className)}
    >
      {f.files.map((file, i) => (
        <FileInputItem key={`${file.name}-${i}`} file={file} index={i}>
          {children?.(file, i)}
        </FileInputItem>
      ))}
    </ul>
  );
}

export type FileInputItemProps = Omit<ComponentProps<"li">, "children"> & {
  file: File;
  /** Its place in the list, for the remove button. */
  index: number;
  /** Replaces the row's content (icon, name, size, remove button). */
  children?: ReactNode;
};

/** One chosen file: an icon, its name and size, and a button to remove it. */
export function FileInputItem({ file, index, className, children, ...rest }: FileInputItemProps) {
  const f = useFile();
  return (
    <li data-slot="file-input-item" {...rest} className={cx("fg-file-row", className)}>
      {children ?? (
        <>
          <Icon icon={AttachmentIcon} size={12} variant="mono" />
          <span className="fg-file-name">{file.name}</span>
          <span className="fg-file-size">{formatFileSize(file.size)}</span>
          <button
            type="button"
            className="fg-combo-chip-x"
            aria-label={`Remove ${file.name}`}
            disabled={f.disabled}
            onClick={() => f.setFiles(f.files.filter((_, j) => j !== index))}
          >
            <Icon icon={Cancel01Icon} size={12} variant="mono" />
          </button>
        </>
      )}
    </li>
  );
}
