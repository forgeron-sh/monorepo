// Uploading: the queue that follows each file: progress in blocks, cancel, retry, minimise. The
// uploading itself is the caller's: this block draws its state. The drop zone, where the files
// land, is a primitive: `drop-zone.tsx`.
//
// A root with parts. Without children it draws the header, the rows and the foot; with children,
// they place them: `UploadQueueHeader`, `UploadQueueList` (of `UploadQueueRow`s), `UploadQueueFooter`.

import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  RefreshIcon,
  Upload01Icon,
} from "@forgeron/icons";
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
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
  /** The regions of the queue; without them, the header, the rows and the foot. */
  children?: ReactNode;
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

interface QueueContext {
  items: ReadonlyArray<UploadItem>;
  busy: boolean;
  failed: boolean;
  folded: boolean;
  setFolded: (folded: boolean) => void;
  listId: string;
  sent: number;
  total: number;
  footer: ReactNode;
  onCancel: ((id: string) => void) | undefined;
  onRetry: ((id: string) => void) | undefined;
  onCancelAll: (() => void) | undefined;
  onClear: (() => void) | undefined;
  onOpen: ((id: string) => void) | undefined;
}

const Ctx = createContext<QueueContext | null>(null);

/** The files and what is done with them, for a part of your own inside an `UploadQueue`. */
export function useUploadQueue(part = "useUploadQueue"): QueueContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside an <UploadQueue>.`);
  return ctx;
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
  children,
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
    <Ctx.Provider
      value={{
        items,
        busy,
        failed,
        folded,
        setFolded,
        listId,
        sent,
        total,
        footer,
        onCancel,
        onRetry,
        onCancelAll,
        onClear,
        onOpen,
      }}
    >
      <section
        data-slot="upload-queue"
        className={cx("fg-upq", placement === "corner" && "fg-upq-corner", className)}
        aria-label="Uploads"
      >
        {children ?? (
          <>
            <UploadQueueHeader />
            <UploadQueueList />
            <UploadQueueFooter />
          </>
        )}
      </section>
    </Ctx.Provider>
  );
}

/** The summary, the bytes sent, the fold button and the close button. */
export function UploadQueueHeader({ className, ...rest }: ComponentProps<"header">) {
  const { items, busy, failed, folded, setFolded, listId, sent, total, onClear } =
    useUploadQueue("UploadQueueHeader");
  return (
    <header data-slot="upload-queue-header" {...rest} className={cx("fg-upq-head", className)}>
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
  );
}

/** The rows, hidden while the queue is minimised. */
export function UploadQueueList({ className, children, ...rest }: ComponentProps<"ul">) {
  const { items, folded, listId } = useUploadQueue("UploadQueueList");
  if (folded) return null;
  return (
    <ul
      data-slot="upload-queue-list"
      id={listId}
      {...rest}
      className={cx("fg-upq-list", className)}
    >
      {children ?? items.map((item) => <UploadQueueRow key={item.id} item={item} />)}
    </ul>
  );
}

/** One file: its type, name, progress in blocks, the word of its state, cancel or retry. */
export function UploadQueueRow({
  item,
  className,
  ...rest
}: Omit<ComponentProps<"li">, "children"> & { item: UploadItem }) {
  const { onCancel, onRetry, onOpen } = useUploadQueue("UploadQueueRow");
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
    <li
      data-slot="upload-queue-row"
      {...rest}
      className={cx("fg-upq-row", `fg-upq-${item.status}`, className)}
    >
      <FileTypeMark kind={fileKindOf(item.name)} />
      <div className="fg-upq-main">
        {item.status === "done" && onOpen ? (
          <button type="button" className="fg-upq-name fg-upq-link" onClick={() => onOpen(item.id)}>
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
      <span className={cx("fg-upq-word", item.status === "failed" && "fg-upq-error")}>{word}</span>
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
}

/** The foot: where the files go, and Cancel all; nothing while minimised or with nothing to say. */
export function UploadQueueFooter({ className, children, ...rest }: ComponentProps<"footer">) {
  const { folded, busy, footer, onCancelAll } = useUploadQueue("UploadQueueFooter");
  if (folded || !(children || footer || (busy && onCancelAll))) return null;
  return (
    <footer data-slot="upload-queue-footer" {...rest} className={cx("fg-upq-foot", className)}>
      {children ?? (
        <>
          <span>{footer}</span>
          {busy && onCancelAll ? (
            <Button variant="ghost" size="sm" onClick={onCancelAll}>
              Cancel all
            </Button>
          ) : null}
        </>
      )}
    </footer>
  );
}
