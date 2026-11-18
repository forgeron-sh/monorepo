// Moving or copying items to another folder: where they are now, the folder tree to pick the
// destination from (the items themselves and the folder they are already in cannot be picked),
// a line that says where they will go, and the button. A double click on a folder confirms.
// `MovePanel` is the content; `MoveDialog` puts it in a modal.

import { useState } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Dialog } from "../dialog";
import { useControllableState } from "../hooks/use-controllable";
import { findFolder, folderPath, FolderTree, type FolderNode } from "./drive-folder-tree";

export interface MovePanelProps {
  /** The folders to choose from. */
  folders: ReadonlyArray<FolderNode>;
  /** `move` (default) or `copy`: the words of the button. */
  mode?: "move" | "copy";
  /** Where the items are now, written above the tree. */
  from?: string;
  /** Folders that cannot be picked: the items moved, and the folder they are in for a move. */
  disabledIds?: ReadonlyArray<string>;
  /** The destination picked. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (folderId: string) => void;
  /** The folders open at first; the way to `value` by default. */
  defaultExpanded?: ReadonlyArray<string>;
  onLoadChildren?: (id: string) => void | Promise<unknown>;
  /** The move or copy, to the folder picked. */
  onConfirm: (folderId: string) => void;
  onCancel?: () => void;
  className?: string;
}

/** The path of a folder in words: "My files › Sales › Contracts". */
export function folderLabel(folders: ReadonlyArray<FolderNode>, id: string): string {
  const path = folderPath(folders, id) ?? [];
  return [...path, id].map((x) => findFolder(folders, x)?.name ?? x).join(" › ");
}

/** The tree to pick a destination from, the line that names it, Cancel and Move here. */
export function MovePanel({
  folders,
  mode = "move",
  from,
  disabledIds = [],
  value,
  defaultValue = null,
  onChange,
  defaultExpanded,
  onLoadChildren,
  onConfirm,
  onCancel,
  className,
}: MovePanelProps) {
  const [pick, setPick] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange: (id) => {
      if (id !== null) onChange?.(id);
    },
  });
  const [opened] = useState<ReadonlyArray<string>>(
    () =>
      defaultExpanded ??
      (pick ? (folderPath(folders, pick) ?? []) : folders.map((f) => f.id).slice(0, 1)),
  );
  const verb = mode === "move" ? "Move here" : "Copy here";
  return (
    <div className={cx("fg-move", className)}>
      {from ? <p className="fg-move-from">Now in {from}</p> : null}
      <div className="fg-move-tree">
        <FolderTree
          folders={folders}
          label="Destination"
          defaultExpanded={opened}
          selected={pick}
          onSelectedChange={setPick}
          onOpen={onConfirm}
          disabledIds={disabledIds}
          {...(onLoadChildren ? { onLoadChildren } : {})}
        />
      </div>
      <div className="fg-move-foot">
        <span className="fg-move-to" aria-live="polite">
          {pick ? `To ${folderLabel(folders, pick)}` : "Pick a folder"}
        </span>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button variant="primary" disabled={!pick} onClick={() => pick && onConfirm(pick)}>
          {verb}
        </Button>
      </div>
    </div>
  );
}

export interface MoveDialogProps extends Omit<MovePanelProps, "onCancel"> {
  /** What is moved, for the title: `“Dock plan.pdf”`, `3 items`. */
  itemLabel: string;
  /** Escape, a click outside, Cancel. */
  onClose: () => void;
}

/** Move or copy to a folder, in a modal. Render it only while open; confirming closes it. */
export function MoveDialog({
  itemLabel,
  onClose,
  onConfirm,
  mode = "move",
  ...panel
}: MoveDialogProps) {
  return (
    <Dialog
      title={`${mode === "move" ? "Move" : "Copy"} ${itemLabel}`}
      onClose={onClose}
      className="fg-move-dialog"
    >
      <MovePanel
        {...panel}
        mode={mode}
        onCancel={onClose}
        onConfirm={(id) => {
          onConfirm(id);
          onClose();
        }}
      />
    </Dialog>
  );
}
