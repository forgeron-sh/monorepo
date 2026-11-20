// Uploading: the queue that follows each file: progress in blocks, cancel, retry, minimise. The
// uploading itself is the caller's: this block draws its state. The drop zone, where the files
// land, is a primitive: `drop-zone.tsx`.

import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  RefreshIcon,
  Upload01Icon,
} from "@forgeron/icons";
import { useId, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { BlockBar, fileKindOf, FileTypeMark, formatBytes } from "./drive-parts";

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
