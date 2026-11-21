// Moving or copying items to another folder: where they are now, the folder tree to pick the
// destination from (the items themselves and the folder they are already in cannot be picked),
// a line that says where they will go, and the button. A double click on a folder confirms.
// `MovePanel` is the content; `MoveDialog` puts it in a modal.
//
// Roots with parts. `MovePanel` (`MovePanelFrom`, `MovePanelTree`, `MovePanelFooter` with
// `MovePanelTo`, `MovePanelCancel`, `MovePanelConfirm`) and `MoveDialog` (`MoveDialogHeader`,
// `MoveDialogPanel`). Without children each draws all its regions; with children they are yours.

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../dialog";
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
  /** The regions of the panel; without them, the line, the tree and the foot. */
  children?: ReactNode;
  className?: string;
}

/** The path of a folder in words: "My files › Sales › Contracts". */
export function folderLabel(folders: ReadonlyArray<FolderNode>, id: string): string {
  const path = folderPath(folders, id) ?? [];
  return [...path, id].map((x) => findFolder(folders, x)?.name ?? x).join(" › ");
}

interface MoveContext {
  folders: ReadonlyArray<FolderNode>;
  mode: "move" | "copy";
  from: string | undefined;
  disabledIds: ReadonlyArray<string>;
  pick: string | null;
  setPick: (id: string | null) => void;
  opened: ReadonlyArray<string>;
  onLoadChildren: ((id: string) => void | Promise<unknown>) | undefined;
  onConfirm: (folderId: string) => void;
  onCancel: (() => void) | undefined;
}

const Ctx = createContext<MoveContext | null>(null);

/** The folder picked and the handlers of the enclosing `MovePanel`. */
export function useMovePanel(part = "useMovePanel"): MoveContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <MovePanel>.`);
  return ctx;
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
  children,
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
  return (
    <Ctx.Provider
      value={{
        folders,
        mode,
        from,
        disabledIds,
        pick,
        setPick,
        opened,
        onLoadChildren,
        onConfirm,
        onCancel,
      }}
    >
      <div data-slot="move-panel" className={cx("fg-move", className)}>
        {children ?? (
          <>
            <MovePanelFrom />
            <MovePanelTree />
            <MovePanelFooter />
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}

/** "Now in My files": where the items are now; nothing without `from`. */
export function MovePanelFrom({ className, children, ...rest }: ComponentProps<"p">) {
  const { from } = useMovePanel("MovePanelFrom");
  if (!from && !children) return null;
  return (
    <p data-slot="move-panel-from" {...rest} className={cx("fg-move-from", className)}>
      {children ?? `Now in ${from}`}
    </p>
  );
}

/** The folders to pick from; a double click on one confirms. */
export function MovePanelTree({ className, ...rest }: ComponentProps<"div">) {
  const { folders, opened, pick, setPick, onConfirm, disabledIds, onLoadChildren } =
    useMovePanel("MovePanelTree");
  return (
    <div data-slot="move-panel-tree" {...rest} className={cx("fg-move-tree", className)}>
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
  );
}

/** The foot: where it will go, Cancel and the button. Children replace them. */
export function MovePanelFooter({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="move-panel-footer" {...rest} className={cx("fg-move-foot", className)}>
      {children ?? (
        <>
          <MovePanelTo />
          <MovePanelCancel />
          <MovePanelConfirm />
        </>
      )}
    </div>
  );
}

/** "To My files › Sales", or "Pick a folder". */
export function MovePanelTo({ className, ...rest }: ComponentProps<"span">) {
  const { pick, folders } = useMovePanel("MovePanelTo");
  return (
    <span
      data-slot="move-panel-to"
      aria-live="polite"
      {...rest}
      className={cx("fg-move-to", className)}
    >
      {pick ? `To ${folderLabel(folders, pick)}` : "Pick a folder"}
    </span>
  );
}

/** Cancel; nothing is drawn without `onCancel`. */
export function MovePanelCancel({
  children = "Cancel",
  ...rest
}: Omit<ComponentProps<"button">, "ref">) {
  const { onCancel } = useMovePanel("MovePanelCancel");
  if (!onCancel) return null;
  return (
    <Button data-slot="move-panel-cancel" variant="ghost" onClick={onCancel} {...rest}>
      {children}
    </Button>
  );
}

/** "Move here" or "Copy here", off until a folder is picked. */
export function MovePanelConfirm({ children, ...rest }: Omit<ComponentProps<"button">, "ref">) {
  const { pick, mode, onConfirm } = useMovePanel("MovePanelConfirm");
  return (
    <Button
      data-slot="move-panel-confirm"
      variant="primary"
      disabled={!pick}
      onClick={() => pick && onConfirm(pick)}
      {...rest}
    >
      {children ?? (mode === "move" ? "Move here" : "Copy here")}
    </Button>
  );
}

export interface MoveDialogProps extends Omit<MovePanelProps, "onCancel"> {
  /** What is moved, for the title: `“Dock plan.pdf”`, `3 items`. */
  itemLabel: string;
  /** Escape, a click outside, Cancel. */
  onClose: () => void;
}

interface MoveDialogContext {
  itemLabel: string;
  mode: "move" | "copy";
  panel: Omit<MovePanelProps, "onCancel" | "onConfirm" | "mode" | "children" | "className">;
  onConfirm: (id: string) => void;
  onClose: () => void;
}

const DialogCtx = createContext<MoveDialogContext | null>(null);

function useMoveDialog(part: string): MoveDialogContext {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <MoveDialog>.`);
  return ctx;
}

/**
 * Move or copy to a folder, in a modal. Render it only while open; confirming closes it. With
 * children, a shadcn dialog whose content is `MoveDialogHeader` and `MoveDialogPanel`.
 */
export function MoveDialog({
  itemLabel,
  onClose,
  onConfirm,
  mode = "move",
  children,
  className,
  ...panel
}: MoveDialogProps) {
  const confirm = (id: string) => {
    onConfirm(id);
    onClose();
  };
  return (
    <DialogCtx.Provider value={{ itemLabel, mode, panel, onConfirm: confirm, onClose }}>
      {children !== undefined ? (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
          <DialogContent className={cx("fg-move-dialog", className)}>{children}</DialogContent>
        </Dialog>
      ) : (
        <Dialog
          title={`${mode === "move" ? "Move" : "Copy"} ${itemLabel}`}
          onClose={onClose}
          className={cx("fg-move-dialog", className)}
        >
          <MoveDialogPanel />
        </Dialog>
      )}
    </DialogCtx.Provider>
  );
}

/** The title: "Move 3 items". */
export function MoveDialogHeader({ children, ...rest }: ComponentProps<"div">) {
  const { itemLabel, mode } = useMoveDialog("MoveDialogHeader");
  return (
    <DialogHeader data-slot="move-dialog-header" {...rest}>
      {children ?? <DialogTitle>{`${mode === "move" ? "Move" : "Copy"} ${itemLabel}`}</DialogTitle>}
    </DialogHeader>
  );
}

/** The panel; confirming calls `onConfirm` then closes. Children are the panel's own parts. */
export function MoveDialogPanel({ children, ...rest }: Partial<Omit<MovePanelProps, "folders">>) {
  const { panel, mode, onConfirm, onClose } = useMoveDialog("MoveDialogPanel");
  return (
    <MovePanel {...panel} {...rest} mode={mode} onCancel={onClose} onConfirm={onConfirm}>
      {children}
    </MovePanel>
  );
}
