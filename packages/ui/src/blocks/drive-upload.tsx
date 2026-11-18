// Uploading: the drop zone (a framed area with its button, or an overlay over a whole view while
// files are dragged over it), and the queue that follows each file: progress in blocks, cancel,
// retry, minimise. The uploading itself is the caller's: these blocks draw its state.

import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  RefreshIcon,
  Upload01Icon,
} from "@forgeron/icons";
import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { BlockBar, fileKindOf, FileTypeMark, formatBytes } from "./drive-parts";

/* ---------------------------------------------------------------- accept */

/**
 * Whether a file matches an `accept` list as `<input type="file">` reads it: extensions
 * (`.pdf`), types (`image/png`) and families (`image/*`), separated by commas.
 */
export function acceptsFile(file: { name: string; type: string }, accept?: string): boolean {
  if (!accept || !accept.trim()) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) =>
      rule.startsWith(".")
        ? name.endsWith(rule)
        : rule.endsWith("/*")
          ? type.startsWith(rule.slice(0, -1))
          : type === rule,
    );
}

const hasFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

/* ---------------------------------------------------------------- DropZone */

export interface DropZoneProps {
  /** The files dropped or chosen that match `accept`. */
  onFiles: (files: File[]) => void;
  /** The files left out by `accept` or `multiple`: say why. */
  onReject?: (files: File[]) => void;
  /** As on `<input type="file">`: `.pdf,image/*`. */
  accept?: string;
  /** Takes several files at once; true by default. */
  multiple?: boolean;
  disabled?: boolean;
  /** The big line of the framed zone. */
  title?: ReactNode;
  /** A line under it: the types and the size allowed. */
  description?: ReactNode;
  /** The button that opens the file chooser. */
  buttonLabel?: string;
  /**
   * A view to cover: the zone is then invisible until files are dragged over it, and shows the
   * overlay with `overlayLabel`. Without children, it is a framed area with its button.
   */
  children?: ReactNode;
  /** Said on the overlay: "Drop to upload to Contracts". */
  overlayLabel?: ReactNode;
  className?: string;
}

/** Where files land: a framed area with a button, or an overlay over a view while files are dragged. */
export function DropZone({
  onFiles,
  onReject,
  accept,
  multiple = true,
  disabled = false,
  title = "Drop files here",
  description,
  buttonLabel = "Choose files",
  children,
  overlayLabel = "Drop to upload",
  className,
}: DropZoneProps) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const take = (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const ok = files.filter((f) => acceptsFile(f, accept));
    const kept = multiple ? ok : ok.slice(0, 1);
    const rejected = files.filter((f) => !kept.includes(f));
    if (kept.length > 0) onFiles(kept);
    if (rejected.length > 0) onReject?.(rejected);
  };

  const drag = disabled
    ? {}
    : {
        onDragEnter: (e: DragEvent) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          depth.current += 1;
          setActive(true);
        },
        onDragOver: (e: DragEvent) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        },
        onDragLeave: (e: DragEvent) => {
          if (!hasFiles(e)) return;
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setActive(false);
        },
        onDrop: (e: DragEvent) => {
          if (!hasFiles(e)) return;
          // A folder or a row inside may have taken the drop already.
          depth.current = 0;
          setActive(false);
          if (e.defaultPrevented) return;
          e.preventDefault();
          take(e.dataTransfer.files);
        },
      };

  const chooser = (
    <input
      ref={input}
      type="file"
      className="fg-sr"
      tabIndex={-1}
      aria-hidden="true"
      multiple={multiple}
      {...(accept ? { accept } : {})}
      disabled={disabled}
      onChange={(e) => {
        take(e.currentTarget.files);
        e.currentTarget.value = "";
      }}
    />
  );

  if (children !== undefined) {
    return (
      <div className={cx("fg-dropzone-cover", active && "fg-dropzone-active", className)} {...drag}>
        {children}
        {active ? (
          <div className="fg-dropzone-overlay" aria-hidden="true">
            <span>
              <Icon icon={Upload01Icon} size={24} />
              {overlayLabel}
            </span>
          </div>
        ) : null}
        <span className="fg-sr" aria-live="polite">
          {active ? overlayLabel : ""}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "fg-dropzone",
        active && "fg-dropzone-active",
        disabled && "fg-dropzone-disabled",
        className,
      )}
      {...drag}
    >
      <Icon icon={Upload01Icon} size={36} className="fg-dropzone-icon" />
      <p className="fg-dropzone-title">{active ? overlayLabel : title}</p>
      {description ? (
        <p className="fg-dropzone-text" id={hintId}>
          {description}
        </p>
      ) : null}
      <Button
        size="sm"
        disabled={disabled}
        onClick={() => input.current?.click()}
        {...(description ? { "aria-describedby": hintId } : {})}
      >
        <Icon icon={Upload01Icon} size={12} variant="mono" />
        {buttonLabel}
      </Button>
      {chooser}
    </div>
  );
}

/* ---------------------------------------------------------------- UploadQueue */

export type UploadStatus = "queued" | "uploading" | "done" | "failed" | "cancelled";

export interface UploadItem {
  id: string;
  name: string;
  /** In bytes. */
  size?: number;
  /** Between 0 and 1. */
  progress: number;
  status: UploadStatus;
  /** Why it failed, in a few words: "Too large", "Connection lost". */
  error?: string;
}

export interface UploadQueueProps {
  items: ReadonlyArray<UploadItem>;
  /** Stops one file, queued or uploading. */
  onCancel?: (id: string) => void;
  /** Starts a failed or cancelled file again. */
  onRetry?: (id: string) => void;
  /** Stops every file still running. */
  onCancelAll?: () => void;
  /** Removes the list once nothing runs; the × too. */
  onClear?: () => void;
  /** A done file's name becomes a button: open it, show it in its folder. */
  onOpen?: (id: string) => void;
  /** Folded to its header. */
  minimized?: boolean;
  defaultMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  /** A line at the foot: where the files go. */
  footer?: ReactNode;
  /** `inline` (default) in the flow; `corner`: fixed at the bottom right of the window. */
  placement?: "inline" | "corner";
  className?: string;
}

const running = (s: UploadStatus) => s === "queued" || s === "uploading";

/** What the queue says in its header: "Uploading 2 of 5", "5 uploads complete", "1 failed". */
export function uploadSummary(items: ReadonlyArray<UploadItem>): string {
  const left = items.filter((i) => running(i.status)).length;
  const failed = items.filter((i) => i.status === "failed").length;
  const done = items.filter((i) => i.status === "done").length;
  // The file being sent is the first one still running.
  if (left > 0) return `Uploading ${items.length - left + 1} of ${items.length}`;
  if (failed > 0) return `${failed} failed, ${done} uploaded`;
  return `${done} upload${done === 1 ? "" : "s"} complete`;
}

/** The files being uploaded: one row each, progress in blocks, cancel and retry. */
export function UploadQueue({
  items,
  onCancel,
  onRetry,
  onCancelAll,
  onClear,
  onOpen,
  minimized,
  defaultMinimized = false,
  onMinimizedChange,
  footer,
  placement = "inline",
  className,
}: UploadQueueProps) {
  const [folded, setFolded] = useControllableState({
    value: minimized,
    defaultValue: defaultMinimized,
    onChange: onMinimizedChange,
  });
  const listId = useId();
  if (items.length === 0) return null;
  const busy = items.some((i) => running(i.status));
  const failed = items.some((i) => i.status === "failed");
  // The total counts the files that are sent or still to send, not the ones given up.
  const counted = items.filter((i) => i.status !== "failed" && i.status !== "cancelled");
  const total = counted.reduce((s, i) => s + (i.size ?? 0), 0);
  const sent = counted.reduce(
    (s, i) => s + (i.size ?? 0) * (i.status === "done" ? 1 : Math.min(Math.max(i.progress, 0), 1)),
    0,
  );
  return (
    <section
      className={cx("fg-upq", placement === "corner" && "fg-upq-corner", className)}
      aria-label="Uploads"
    >
      <header className="fg-upq-head">
        <Icon
          icon={busy ? Upload01Icon : failed ? AlertCircleIcon : CheckmarkCircle01Icon}
          size={12}
          variant="mono"
          className={cx("fg-upq-state", failed && !busy && "fg-upq-alert")}
        />
        <b className="fg-upq-title" role="status">
          {uploadSummary(items)}
        </b>
        {busy && total > 0 ? (
          <span className="fg-upq-total">
            {formatBytes(sent)} / {formatBytes(total)}
          </span>
        ) : null}
        <IconButton
          icon={folded ? ArrowUp01Icon : ArrowDown01Icon}
          label={folded ? "Show uploads" : "Hide uploads"}
          size="sm"
          aria-expanded={!folded}
          aria-controls={listId}
          onClick={() => setFolded(!folded)}
        />
        {onClear && !busy ? (
          <IconButton icon={Cancel01Icon} label="Close" size="sm" onClick={onClear} />
        ) : null}
      </header>
      {folded ? null : (
        <>
          <ul className="fg-upq-list" id={listId}>
            {items.map((item) => {
              const p = Math.min(Math.max(item.progress, 0), 1);
              const word =
                item.status === "done"
                  ? "Done"
                  : item.status === "failed"
                    ? (item.error ?? "Failed")
                    : item.status === "cancelled"
                      ? "Cancelled"
                      : item.status === "queued"
                        ? "Waiting"
                        : `${Math.round(p * 100)}%`;
              return (
                <li key={item.id} className={cx("fg-upq-row", `fg-upq-${item.status}`)}>
                  <FileTypeMark kind={fileKindOf(item.name)} />
                  <div className="fg-upq-main">
                    {item.status === "done" && onOpen ? (
                      <button
                        type="button"
                        className="fg-upq-name fg-upq-link"
                        onClick={() => onOpen(item.id)}
                      >
                        {item.name}
                      </button>
                    ) : (
                      <span className="fg-upq-name">{item.name}</span>
                    )}
                    {item.status === "uploading" || item.status === "queued" ? (
                      <span
                        role="progressbar"
                        aria-label={`Uploading ${item.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(p * 100)}
                        className="fg-upq-bar"
                      >
                        <BlockBar runs={[{ ratio: p, tone: "accent" }]} cells={30} />
                      </span>
                    ) : null}
                  </div>
                  <span className={cx("fg-upq-word", item.status === "failed" && "fg-upq-error")}>
                    {word}
                  </span>
                  <span className="fg-upq-act">
                    {running(item.status) && onCancel ? (
                      <IconButton
                        icon={Cancel01Icon}
                        label={`Cancel ${item.name}`}
                        size="sm"
                        onClick={() => onCancel(item.id)}
                      />
                    ) : (item.status === "failed" || item.status === "cancelled") && onRetry ? (
                      <IconButton
                        icon={RefreshIcon}
                        label={`Retry ${item.name}`}
                        size="sm"
                        onClick={() => onRetry(item.id)}
                      />
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {footer || (busy && onCancelAll) ? (
            <footer className="fg-upq-foot">
              <span>{footer}</span>
              {busy && onCancelAll ? (
                <Button variant="ghost" size="sm" onClick={onCancelAll}>
                  Cancel all
                </Button>
              ) : null}
            </footer>
          ) : null}
        </>
      )}
    </section>
  );
}
