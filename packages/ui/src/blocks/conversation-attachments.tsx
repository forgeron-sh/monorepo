// The files on a message or in a draft: a picture or a file mark, the name (a download link when the
// file has an address), its size, an upload that has not finished as a track, one that failed with
// a retry, and a remove button when the list can be edited.

import {
  Cancel01Icon,
  Download01Icon,
  File01Icon,
  Image01Icon,
  Refresh01Icon,
} from "@forgeron/icons";
import { cx } from "../cx";
import { formatFileSize } from "../file-input";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import type { ConversationAttachment } from "./conversation-model";

export interface AttachmentListProps {
  items: ReadonlyArray<ConversationAttachment>;
  /** Shows a remove button on each file (a draft). */
  onRemove?: (item: ConversationAttachment) => void;
  /** Shows a Retry button on a file that failed. */
  onRetry?: (item: ConversationAttachment) => void;
  /** `list`: one row each. `grid`: pictures as larger tiles. Default `list`. */
  layout?: "list" | "grid";
  /** Names the list for assistive technology. Default "Attachments". */
  label?: string;
  className?: string;
}

const isImage = (item: ConversationAttachment) =>
  (item.type ?? "").startsWith("image/") || item.thumbnail !== undefined;

const extension = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1, dot + 5).toUpperCase() : "";
};

/** Files with a thumbnail or a mark, their size, their progress, and remove, retry and download. */
export function AttachmentList({
  items,
  onRemove,
  onRetry,
  layout = "list",
  label = "Attachments",
  className,
}: AttachmentListProps) {
  if (items.length === 0) return null;
  return (
    <ul
      className={cx("fg-conv-files", layout === "grid" && "fg-conv-files-grid", className)}
      aria-label={label}
    >
      {items.map((item) => {
        const picture = item.thumbnail ?? (isImage(item) ? item.url : undefined);
        const uploading = item.progress !== undefined && item.error === undefined;
        const percent = Math.round(Math.min(Math.max(item.progress ?? 0, 0), 1) * 100);
        const name =
          item.url && !uploading ? (
            <a className="fg-conv-file-name" href={item.url} download={item.name}>
              {item.name}
            </a>
          ) : (
            <span className="fg-conv-file-name">{item.name}</span>
          );
        return (
          <li key={item.id} className={cx("fg-conv-file", item.error && "fg-conv-file-failed")}>
            <span className="fg-conv-file-thumb" aria-hidden="true">
              {picture ? (
                <img src={picture} alt="" />
              ) : (
                <>
                  <Icon icon={isImage(item) ? Image01Icon : File01Icon} size={16} variant="mono" />
                  <span className="fg-conv-file-ext">{extension(item.name)}</span>
                </>
              )}
            </span>
            <span className="fg-conv-file-body">
              {name}
              <span className="fg-conv-file-meta">
                {item.size !== undefined ? formatFileSize(item.size) : null}
                {item.size !== undefined && (uploading || item.error) ? " · " : null}
                {uploading ? `${percent}%` : null}
                {item.error ? (
                  <span className="fg-conv-file-error">Failed: {item.error}</span>
                ) : null}
              </span>
              {uploading ? (
                <span
                  className="fg-conv-file-track"
                  role="progressbar"
                  aria-label={`Uploading ${item.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                >
                  <span style={{ width: `${percent}%` }} />
                </span>
              ) : null}
            </span>
            <span className="fg-conv-file-actions">
              {item.url && !uploading && layout === "list" ? (
                <IconButton
                  icon={Download01Icon}
                  label={`Download ${item.name}`}
                  size="sm"
                  href={item.url}
                  download={item.name}
                />
              ) : null}
              {item.error && onRetry ? (
                <IconButton
                  icon={Refresh01Icon}
                  label={`Retry ${item.name}`}
                  size="sm"
                  onClick={() => onRetry(item)}
                />
              ) : null}
              {onRemove ? (
                <IconButton
                  icon={Cancel01Icon}
                  label={`Remove ${item.name}`}
                  size="sm"
                  onClick={() => onRemove(item)}
                />
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
