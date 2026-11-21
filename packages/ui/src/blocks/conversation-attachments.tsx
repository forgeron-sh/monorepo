// The files on a message or in a draft: a picture or a file mark, the name (a download link when the
// file has an address), its size, an upload that has not finished as a track, one that failed with
// a retry, and a remove button when the list can be edited.
//
// With `items` it is the usual list. With children it is a frame, and the parts build each row:
//
//   <AttachmentList onRemove={remove}>
//     {files.map((file) => (
//       <AttachmentListItem key={file.id} item={file}>
//         <AttachmentListThumb />
//         <AttachmentListBody><AttachmentListName /><AttachmentListMeta /><AttachmentListProgress /></AttachmentListBody>
//         <AttachmentListActions><AttachmentListDownload /><AttachmentListRetry /><AttachmentListRemove /></AttachmentListActions>
//       </AttachmentListItem>
//     ))}
//   </AttachmentList>

import {
  Cancel01Icon,
  Download01Icon,
  File01Icon,
  Image01Icon,
  Refresh01Icon,
} from "@forgeron/icons";
import { createContext, useContext, type ReactNode } from "react";
import { cx } from "../cx";
import { formatFileSize } from "../file-input";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import type { ConversationAttachment } from "./conversation-model";
import { part, type PartProps } from "../part";

interface ListContext {
  layout: "list" | "grid";
  onRemove: ((item: ConversationAttachment) => void) | undefined;
  onRetry: ((item: ConversationAttachment) => void) | undefined;
}
const ListCtx = createContext<ListContext>({
  layout: "list",
  onRemove: undefined,
  onRetry: undefined,
});
const ItemCtx = createContext<ConversationAttachment | null>(null);

function useItem(name: string): ConversationAttachment {
  const item = useContext(ItemCtx);
  if (!item) throw new Error(`<${name}> goes inside an <AttachmentListItem>.`);
  return item;
}

const isImage = (item: ConversationAttachment) =>
  (item.type ?? "").startsWith("image/") || item.thumbnail !== undefined;

const extension = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1, dot + 5).toUpperCase() : "";
};

const uploadingOf = (item: ConversationAttachment) =>
  item.progress !== undefined && item.error === undefined;
const percentOf = (item: ConversationAttachment) =>
  Math.round(Math.min(Math.max(item.progress ?? 0, 0), 1) * 100);

/* ---------------------------------------------------------------- parts */

export interface AttachmentListItemProps extends PartProps<"li"> {
  /** The file this row is about; its parts read it. */
  item: ConversationAttachment;
}

/** One file: the row, and the file for its parts. */
export function AttachmentListItem({ item, ...rest }: AttachmentListItemProps) {
  return (
    <ItemCtx.Provider value={item}>
      {part(
        "li",
        "attachment-list-item",
        cx("fg-conv-file", item.error && "fg-conv-file-failed"),
        rest,
      )}
    </ItemCtx.Provider>
  );
}

/** The picture of the file, or its mark and extension. */
export function AttachmentListThumb({ children, ...rest }: PartProps<"span">) {
  const item = useItem("AttachmentListThumb");
  const picture = item.thumbnail ?? (isImage(item) ? item.url : undefined);
  return part(
    "span",
    "attachment-list-thumb",
    "fg-conv-file-thumb",
    {
      ...rest,
      children:
        children ??
        (picture ? (
          <img src={picture} alt="" />
        ) : (
          <>
            <Icon icon={isImage(item) ? Image01Icon : File01Icon} size={16} variant="mono" />
            <span className="fg-conv-file-ext">{extension(item.name)}</span>
          </>
        )),
    },
    { "aria-hidden": "true" },
  );
}

/** What is beside the picture: name, size, progress. */
export function AttachmentListBody(props: PartProps<"span">) {
  return part("span", "attachment-list-body", "fg-conv-file-body", props);
}

/** The name: a download link when the file has an address and is not being uploaded. */
export function AttachmentListName({ children, ...rest }: PartProps<"a">) {
  const item = useItem("AttachmentListName");
  const name = children ?? item.name;
  if (item.url && !uploadingOf(item)) {
    return part(
      "a",
      "attachment-list-name",
      "fg-conv-file-name",
      { ...rest, children: name },
      {
        href: item.url,
        download: item.name,
      },
    );
  }
  return part("span", "attachment-list-name", "fg-conv-file-name", {
    ...(rest as PartProps<"span">),
    children: name,
  });
}

/** Its size, then its percentage while uploading or why it failed. */
export function AttachmentListMeta({ children, ...rest }: PartProps<"span">) {
  const item = useItem("AttachmentListMeta");
  const uploading = uploadingOf(item);
  return part("span", "attachment-list-meta", "fg-conv-file-meta", {
    ...rest,
    children: children ?? (
      <>
        {item.size !== undefined ? formatFileSize(item.size) : null}
        {item.size !== undefined && (uploading || item.error) ? " · " : null}
        {uploading ? `${percentOf(item)}%` : null}
        {item.error ? <span className="fg-conv-file-error">Failed: {item.error}</span> : null}
      </>
    ),
  });
}

/** The track of an upload that has not finished; nothing once it has. */
export function AttachmentListProgress(props: PartProps<"span">) {
  const item = useItem("AttachmentListProgress");
  if (!uploadingOf(item)) return null;
  const percent = percentOf(item);
  return part(
    "span",
    "attachment-list-progress",
    "fg-conv-file-track",
    { ...props, children: props.children ?? <span style={{ width: `${percent}%` }} /> },
    {
      role: "progressbar",
      "aria-label": `Uploading ${item.name}`,
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": percent,
    },
  );
}

/** The buttons at the end of the row. */
export function AttachmentListActions(props: PartProps<"span">) {
  return part("span", "attachment-list-actions", "fg-conv-file-actions", props);
}

type ActionProps = Omit<PartProps<"button">, "children" | "asChild" | "onClick"> & {
  onClick?: () => void;
};

/** Downloads the file; only for a file with an address, not uploading, in a `list` layout. */
export function AttachmentListDownload({ className }: { className?: string }) {
  const item = useItem("AttachmentListDownload");
  const { layout } = useContext(ListCtx);
  if (!item.url || uploadingOf(item) || layout !== "list") return null;
  return (
    <IconButton
      data-slot="attachment-list-download"
      icon={Download01Icon}
      label={`Download ${item.name}`}
      size="sm"
      href={item.url}
      download={item.name}
      {...(className ? { className } : {})}
    />
  );
}

/** Sends a failed file again; calls the list's `onRetry` unless given its own `onClick`. */
export function AttachmentListRetry({ onClick, ...rest }: ActionProps) {
  const item = useItem("AttachmentListRetry");
  const { onRetry } = useContext(ListCtx);
  if (!item.error || (!onRetry && !onClick)) return null;
  return (
    <IconButton
      data-slot="attachment-list-retry"
      {...rest}
      icon={Refresh01Icon}
      label={`Retry ${item.name}`}
      size="sm"
      onClick={() => (onClick ?? (() => onRetry?.(item)))()}
    />
  );
}

/** Takes the file out; calls the list's `onRemove` unless given its own `onClick`. */
export function AttachmentListRemove({ onClick, ...rest }: ActionProps) {
  const item = useItem("AttachmentListRemove");
  const { onRemove } = useContext(ListCtx);
  if (!onRemove && !onClick) return null;
  return (
    <IconButton
      data-slot="attachment-list-remove"
      {...rest}
      icon={Cancel01Icon}
      label={`Remove ${item.name}`}
      size="sm"
      onClick={() => (onClick ?? (() => onRemove?.(item)))()}
    />
  );
}

/* ---------------------------------------------------------------- the list */

export interface AttachmentListProps extends Omit<PartProps<"ul">, "children"> {
  items?: ReadonlyArray<ConversationAttachment>;
  /** Shows a remove button on each file (a draft). */
  onRemove?: (item: ConversationAttachment) => void;
  /** Shows a Retry button on a file that failed. */
  onRetry?: (item: ConversationAttachment) => void;
  /** `list`: one row each. `grid`: pictures as larger tiles. Default `list`. */
  layout?: "list" | "grid";
  /** Names the list for assistive technology. Default "Attachments". */
  label?: string;
  /** The rows, as `AttachmentListItem` parts. Without them, one row is made for each of `items`. */
  children?: ReactNode;
}

/** Files with a thumbnail or a mark, their size, their progress, and remove, retry and download. */
export function AttachmentList({
  items = [],
  onRemove,
  onRetry,
  layout = "list",
  label = "Attachments",
  children,
  className,
  ...rest
}: AttachmentListProps) {
  if (children === undefined && items.length === 0) return null;
  return (
    <ListCtx.Provider value={{ layout, onRemove, onRetry }}>
      {part(
        "ul",
        "attachment-list",
        cx("fg-conv-files", layout === "grid" && "fg-conv-files-grid"),
        {
          className,
          ...rest,
          children:
            children ??
            items.map((item) => (
              <AttachmentListItem key={item.id} item={item}>
                <AttachmentListThumb />
                <AttachmentListBody>
                  <AttachmentListName />
                  <AttachmentListMeta />
                  <AttachmentListProgress />
                </AttachmentListBody>
                <AttachmentListActions>
                  <AttachmentListDownload />
                  <AttachmentListRetry />
                  <AttachmentListRemove />
                </AttachmentListActions>
              </AttachmentListItem>
            )),
        },
        { "aria-label": label },
      )}
    </ListCtx.Provider>
  );
}
