/* Blocks of the "drive" group: folders, files, uploads, sharing, after the Drive prototype. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const kind: PropRow = {
  name: "kind",
  type: "FileKind",
  default: "fileKindOf(name)",
  description: "folder, pdf, image, sheet, doc, text, slides, video, audio, archive, code, other.",
};

/** Gallery pages of the "drive" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "file-browser",
    name: "File browser",
    summary:
      "A folder's files as rows or cards: click, ⇧ and ⌘ ranges, lasso, keys, right click, drag onto folders.",
    imports: [
      "FileBrowser",
      "useActions",
      "FileBrowserHeader",
      "FileBrowserRow",
      "FileBrowserTiles",
      "FileBrowserCards",
      "FileBrowserEmpty",
      "FileBrowserLasso",
    ],
    props: [
      {
        name: "Parts",
        type: "FileBrowser > FileBrowserHeader, FileBrowserRow, FileBrowserTiles > FileBrowserTile, FileBrowserCards > FileBrowserCard, FileBrowserEmpty, FileBrowserLasso",
        description:
          "Without children the root draws the layout from `items`. With children they are the parts above; each takes `className`, `...rest` and carries a `data-slot`. `useFileBrowser()` gives a part of your own the items and helpers.",
      },
      {
        name: "items",
        type: "{ id, name, kind?, size?, modified?, owner?, starred?, shared?, locked?, thumbnail?, icon? }[]",
        description:
          "kind: folder for a folder, else found from the name. modified: YYYY-MM-DD HH:mm. locked: no drag, no drop, no rename.",
      },
      {
        name: "layout",
        type: `"list" | "grid"`,
        default: `"list"`,
        description: "Dense rows with columns, or folder tiles and file cards with a thumbnail.",
      },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string[]",
        description:
          "The selection. Click, ⇧ click, ⌘ click, a lasso from the empty space, ⇧ arrows, ⌘A, Escape.",
      },
      { name: "onOpen", type: "(id) => void", description: "A double click or Enter." },
      {
        name: "menu / onAction",
        type: "(ids) => ActionMenuEntry[]; (actionId, ids) => void",
        description:
          "The actions of the selection, behind a right click, the ⋯ of a row and Shift+F10. Give useActions(…).menu.",
      },
      {
        name: "onMove / canDrop",
        type: "(ids, folderId) => void; (folderId, ids) => boolean",
        description: "Items dragged onto a folder. Without onMove, nothing drags.",
      },
      {
        name: "onDropFiles",
        type: "(files, folderId | null) => void",
        description: "Files from the computer, on a folder or on the list (null).",
      },
      {
        name: "onRename / renaming / onRenamingChange",
        type: "(id, name) => void; string | null",
        description: "A name edited in place: F2, or renaming set from a Rename action.",
      },
      { name: "onDelete", type: "(ids) => void", description: "Delete or Backspace." },
      {
        name: "sort / defaultSort / onSortChange",
        type: `{ key: "name" | "owner" | "modified" | "size", direction }`,
        default: "name, ascending",
        description: "Folders always come first. sortable={false} keeps the given order.",
      },
      {
        name: "columns / columnLabels",
        type: `("owner" | "modified" | "size")[]; Partial<Record<key, string>>`,
        default: "all three",
        description: 'The columns after the name, and other headers: { owner: "Shared by" }.',
      },
      {
        name: "today / formatDate",
        type: "string; (value) => string",
        description: "Today shows the time; this year leaves out the year.",
      },
      { name: "lasso", type: "boolean", default: "true", description: "The rectangle selection." },
      { name: "empty", type: "ReactNode", description: "Shown when there is no item." },
      className,
    ],
  },
  {
    slug: "folder-tree",
    name: "Folder tree",
    summary:
      "Folders as a tree: arrows, typeahead, children loaded on first opening, drops of items and files.",
    imports: ["FolderTree", "FolderTreeItem"],
    props: [
      {
        name: "Parts",
        type: "FolderTree > FolderTreeItem",
        description:
          "Without children the root draws one `FolderTreeItem` per folder; with children, place them yourself. A `FolderTreeItem` takes `node` and the `TreeItem` props.",
      },
      {
        name: "folders",
        type: "{ id, name, icon?, children?, hasChildren?, readOnly? }[]",
        description:
          "children absent with hasChildren: loaded on first opening. readOnly: a lock, no drop.",
      },
      {
        name: "expanded / defaultExpanded / onExpandedChange",
        type: "string[]",
        description: "The open folders. Right opens, Left closes or climbs, * opens the siblings.",
      },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string | null",
        description: "The current folder: a click, Space or Enter.",
      },
      { name: "onOpen", type: "(id) => void", description: "Enter or a double click." },
      {
        name: "onLoadChildren",
        type: "(id) => void | Promise",
        description: "Called on the first opening; a promise shows Loading until it settles.",
      },
      {
        name: "onDrop / canDrop",
        type: "(folderId, { ids, files }) => void; (folderId) => boolean",
        description:
          "Items from a FileBrowser or files from the computer. A closed folder opens after a moment under the pointer.",
      },
      {
        name: "disabledIds",
        type: "string[]",
        description: "Seen, not picked, no drop: the items being moved.",
      },
      className,
    ],
  },
  {
    slug: "selection-bar",
    name: "Selection bar",
    summary:
      "“3 selected”, the × that clears, the actions as buttons and the rest behind ⋯. Composed from parts, with an `actions` props shorthand.",
    imports: [
      "SelectionBarRoot",
      "SelectionBarClear",
      "SelectionBarCount",
      "SelectionBarSeparator",
      "SelectionBarActions",
      "SelectionBar",
      "useActions",
    ],
    props: [
      {
        name: "SelectionBarRoot",
        type: "{ count, onClear, render? } & div props",
        description:
          "A toolbar named “Selection”, drawn while `count` is 1 or more. `SelectionBar` is the props shorthand of this root, built from `actions`. Escape inside it calls `onClear`.",
      },
      {
        name: "SelectionBarClear",
        type: "{ label?, asChild? } & button props",
        description:
          "The × that calls `onClear`. `asChild` gives the click to your own button; `preventDefault()` in `onClick` skips the clear.",
      },
      {
        name: "SelectionBarCount",
        type: "{ render? } & b props",
        description:
          "“3 selected”, announced politely as it changes. Give children to write something else (“3 files”).",
      },
      {
        name: "SelectionBarSeparator",
        type: "span",
        description: "The thin rule between the count and the actions.",
      },
      {
        name: "SelectionBarActions",
        type: "{ actions, onAction?, inline?, iconOnly? }",
        description:
          "The screen's actions (`useActions`): the first `inline` (4) as buttons, the rest behind ⋯, the destructive ones in the danger colour; an action with `actions` opens a menu. `iconOnly` lists ids drawn as an icon.",
      },
      { name: "count", type: "number", description: "How many are selected; nothing at 0." },
      { name: "onClear", type: "() => void", description: "The × and Escape." },
      {
        name: "actions",
        type: "Action[]",
        description: "The same list as useActions: run, icon, danger, disabled, sub-actions.",
      },
      {
        name: "inline",
        type: "number",
        default: "4",
        description: "How many actions show as buttons before the ⋯.",
      },
      {
        name: "iconOnly",
        type: "string[]",
        description: "Ids of the actions drawn as an icon alone, the label as a tooltip.",
      },
      { name: "onAction", type: "(id) => void", description: "After the action's own run." },
      className,
    ],
  },
  {
    slug: "upload-queue",
    name: "Upload queue",
    summary: "Each file uploading: progress in blocks, cancel, retry, minimise; the total sent.",
    imports: [
      "UploadQueue",
      "uploadSummary",
      "UploadQueueHeader",
      "UploadQueueList",
      "UploadQueueRow",
      "UploadQueueFooter",
    ],
    props: [
      {
        name: "Parts",
        type: "UploadQueue > UploadQueueHeader, UploadQueueList > UploadQueueRow, UploadQueueFooter",
        description:
          "Without children the header, the rows and the foot are drawn; `UploadQueueRow` takes the `item`.",
      },
      {
        name: "items",
        type: `{ id, name, size?, progress, status, error? }[]`,
        description: `progress from 0 to 1; status queued, uploading, done, failed or cancelled.`,
      },
      {
        name: "onCancel / onRetry / onCancelAll / onClear",
        type: "(id) => void; () => void",
        description: "Each button shows only when it is given and applies.",
      },
      { name: "onOpen", type: "(id) => void", description: "A done file's name is a button." },
      {
        name: "minimized / defaultMinimized / onMinimizedChange",
        type: "boolean",
        description: "Folded to its header.",
      },
      { name: "footer", type: "ReactNode", description: "Where the files go." },
      {
        name: "placement",
        type: `"inline" | "corner"`,
        default: `"inline"`,
        description: "In the flow, or fixed at the bottom right of the window.",
      },
      className,
    ],
  },
  {
    slug: "storage-meter",
    name: "Storage meter",
    summary: "Space used against a budget, in blocks per part, the total in mono, a legend.",
    imports: [
      "StorageMeter",
      "StorageMeterHead",
      "StorageMeterBar",
      "StorageMeterTotal",
      "StorageMeterLegend",
    ],
    props: [
      {
        name: "Parts",
        type: "StorageMeter > StorageMeterHead, StorageMeterBar, StorageMeterTotal, StorageMeterLegend",
        description:
          "Without children the four are drawn; with children, keep the ones you want, in your order.",
      },
      {
        name: "parts",
        type: `{ label, bytes, tone? }[]`,
        description: "What uses the space, in order; tones accent, ink, muted by default.",
      },
      { name: "quota", type: "number", description: "The budget in bytes; past it, danger." },
      { name: "label", type: "string", default: `"Storage"`, description: "Above the bar." },
      { name: "cells", type: "number", default: "40", description: "How many blocks." },
      { name: "action", type: "ReactNode", description: "At the end of the label row." },
      { name: "legend", type: "boolean", default: "true", description: "One line per part." },
      className,
    ],
  },
  {
    slug: "file-preview",
    name: "File preview",
    summary:
      "A file opened for a look: image, page, PDF, video, archive or no preview; arrows to its neighbours.",
    imports: [
      "FilePreview",
      "FileDetails",
      "FilePreviewHeader",
      "FilePreviewActions",
      "FilePreviewNav",
      "FilePreviewBody",
      "FilePreviewStage",
      "FilePreviewAside",
    ],
    props: [
      {
        name: "Parts",
        type: "FilePreview > FilePreviewHeader (FilePreviewActions, FilePreviewNav), FilePreviewBody > FilePreviewStage, FilePreviewAside",
        description:
          "With `FilePreviewHeader` or `FilePreviewBody` as children the root is the frame of the parts; any other children are the stage, as before.",
      },
      { name: "name", type: "string", description: "The title; the kind comes from it." },
      kind,
      { name: "size", type: "number", description: "In bytes." },
      {
        name: "src / text / entries",
        type: "string; string; { name, size? }[]",
        description:
          "The address of a picture, PDF or video; the text of a page; an archive's files.",
      },
      { name: "children", type: "ReactNode", description: "Your own stage: a sheet, slides." },
      {
        name: "onPrevious / onNext / position",
        type: "() => void; { index, total }",
        description: "The arrows in the header and on the keyboard.",
      },
      {
        name: "onDownload / onClose / actions",
        type: "() => void; ReactNode",
        description: "The header's buttons; Escape closes.",
      },
      { name: "meta", type: "ReactNode", description: "A line under the name." },
      { name: "aside", type: "ReactNode", description: "A panel at the right: FileDetails." },
      className,
    ],
  },
  {
    slug: "file-details",
    name: "File details",
    summary: "Who has access, the properties, the versions and the activity of a file or folder.",
    imports: [
      "FileDetails",
      "VersionList",
      "FileDetailsHeader",
      "FileDetailsBody",
      "FileDetailsSections",
      "FileDetailsAccess",
      "FileDetailsProperties",
      "VersionListNote",
      "VersionListItems",
      "VersionListRow",
      "VersionListUpload",
    ],
    props: [
      {
        name: "Parts",
        type: "FileDetails > FileDetailsHeader, FileDetailsBody > FileDetailsSections > FileDetailsAccess, FileDetailsProperties; VersionList > VersionListNote, VersionListItems > VersionListRow, VersionListUpload",
        description:
          "Without children the header and the body are drawn. `VersionList` is a root with parts too.",
      },
      { name: "name", type: "string", description: "The title." },
      kind,
      {
        name: "size / contents / owner / location / modified / created",
        type: "number; string; string; ReactNode; string; string",
        description: "The rows of the details, in this order; dates already written.",
      },
      { name: "fields", type: "{ label, value }[]", description: "More rows after them." },
      {
        name: "access",
        type: `{ people, scope?, summary?, onManage? }`,
        description:
          "Names with access, how far it is open (restricted, organization, link) and the Manage button.",
      },
      {
        name: "versions",
        type: "{ id, label, at, by, size?, note? }[]",
        description: "Newest first: the Versions tab. VersionList is the same list on its own.",
      },
      {
        name: "onRestoreVersion / onDownloadVersion / onUploadVersion",
        type: "(id) => void; () => void",
        description: "The buttons of the versions; leave out on a read-only file.",
      },
      { name: "activity", type: "ReactNode", description: "The Activity tab: AuditLog, Activity." },
      {
        name: "tab / defaultTab / onTabChange",
        type: `"details" | "versions" | "activity"`,
        description: "The tab shown.",
      },
      { name: "onClose", type: "() => void", description: "An × in the header." },
      className,
    ],
  },
  {
    slug: "share-dialog",
    name: "Share dialog",
    summary:
      "People and teams with their role, general access, and the link's expiry, password and download.",
    imports: [
      "ShareDialog",
      "SharePanel",
      "DEFAULT_SHARE",
      "SharePanelAdd",
      "SharePanelPeople",
      "SharePanelGeneral",
      "SharePanelLink",
      "ShareDialogHeader",
      "ShareDialogPanel",
      "ShareDialogFooter",
    ],
    props: [
      {
        name: "Parts",
        type: "SharePanel > SharePanelAdd, SharePanelPeople, SharePanelGeneral > SharePanelLink; ShareDialog > ShareDialogHeader, ShareDialogPanel, ShareDialogFooter",
        description:
          "With children, `ShareDialog` is a shadcn dialog (portal, scrim, focus trap) and these are its content; without, it is the usual modal.",
      },
      {
        name: "directory",
        type: "{ id, name, hint? }[]",
        description: "Who can be added: a combobox with arrows and Enter.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "{ people, general, generalRole, link: { expires, password, download } }",
        default: "DEFAULT_SHARE",
        description: "The settings; general is restricted, organization or link.",
      },
      {
        name: "roles / defaultRole",
        type: "{ value, label }[]; string",
        default: "viewer, commenter, editor; the last",
        description: "The roles, least first.",
      },
      {
        name: "inherited",
        type: "{ person, role, from? }[]",
        description: "Fixed rows: the owner, the access from a parent folder.",
      },
      {
        name: "organization / allowLink",
        type: "string; boolean",
        description: "Offers “Anyone at …”; and “Anyone with the link” (true by default).",
      },
      {
        name: "linkUrl / onCopyLink / expiryOptions / onPasswordChange",
        type: "string; () => void; option[]; (password) => void",
        description: "The link's settings, shown when anyone with the link can open it.",
      },
      {
        name: "itemName / onClose / onDone / description",
        type: "string; () => void; (settings) => void; ReactNode",
        description: "ShareDialog only: the modal around SharePanel, Copy link and Done.",
      },
      className,
    ],
  },
  {
    slug: "move-dialog",
    name: "Move dialog",
    summary: "Move or copy to a folder picked in the tree; a double click confirms.",
    imports: [
      "MoveDialog",
      "MovePanel",
      "folderLabel",
      "MovePanelFrom",
      "MovePanelTree",
      "MovePanelFooter",
      "MovePanelTo",
      "MovePanelCancel",
      "MovePanelConfirm",
      "MoveDialogHeader",
      "MoveDialogPanel",
    ],
    props: [
      {
        name: "Parts",
        type: "MovePanel > MovePanelFrom, MovePanelTree, MovePanelFooter > MovePanelTo, MovePanelCancel, MovePanelConfirm; MoveDialog > MoveDialogHeader, MoveDialogPanel",
        description:
          "With children, `MoveDialog` is a shadcn dialog and these are its content; without, the usual modal.",
      },
      { name: "folders", type: "FolderNode[]", description: "The tree to pick from." },
      {
        name: "mode",
        type: `"move" | "copy"`,
        default: `"move"`,
        description: "The words of the title and the button.",
      },
      { name: "from", type: "string", description: "Where the items are now." },
      {
        name: "disabledIds",
        type: "string[]",
        description: "Folders that cannot be picked: the items, and their folder for a move.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "string | null",
        description: "The destination picked.",
      },
      { name: "onConfirm", type: "(folderId) => void", description: "Move here, Copy here." },
      {
        name: "itemLabel / onClose",
        type: "string; () => void",
        description: "MoveDialog only: “Dock plan.pdf”, 3 items; Escape, Cancel.",
      },
      className,
    ],
  },
  {
    slug: "file-type-mark",
    name: "File type mark",
    summary: "The square pixel mark of a file's kind, found from its name, and sizes for people.",
    imports: ["FileTypeMark", "fileKindOf", "formatBytes", "FILE_KINDS"],
    props: [
      kind,
      { name: "icon", type: "IconDefinition", description: "Another icon: a team drive, an app." },
      { name: "tone", type: "string", description: "Another colour, a token." },
      {
        name: "size",
        type: `"sm" | "lg" | "xl"`,
        default: `"sm"`,
        description: "22px in a row, 40px in a header, 64px unframed on a preview.",
      },
      { name: "label", type: "string", description: "Names it; decorative otherwise." },
      className,
    ],
  },
];
