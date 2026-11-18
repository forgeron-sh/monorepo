// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acceptsFile,
  DRIVE_DRAG_TYPE,
  DropZone,
  FileBrowser,
  FileDetails,
  fileKindOf,
  FilePreview,
  FileTypeMark,
  folderLabel,
  FolderTree,
  formatBytes,
  formatWhen,
  MovePanel,
  SelectionBar,
  selectionAfterClick,
  SharePanel,
  sortDriveItems,
  StorageMeter,
  UploadQueue,
  uploadSummary,
  type DriveItem,
  type FolderNode,
  type ShareSettings,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
afterEach(() => {
  host?.remove();
  host = undefined;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });
const click = async (el: Element, init: MouseEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, ...init }));
  });
/** A drag event with a fake DataTransfer: jsdom has none. */
const drag = async (
  el: Element,
  type: string,
  data: { types: string[]; files?: File[]; get?: Record<string, string> },
) =>
  act(async () => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: {
        types: data.types,
        files: data.files ?? [],
        getData: (t: string) => data.get?.[t] ?? "",
        setData: () => {},
        dropEffect: "none",
        effectAllowed: "all",
      },
    });
    el.dispatchEvent(event);
  });
const typeInto = async (input: HTMLInputElement, value: string) =>
  act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

describe("drive parts", () => {
  it("finds the kind of a file from its name", () => {
    expect(fileKindOf("Q3 report.PDF")).toBe("pdf");
    expect(fileKindOf("plan.xlsx")).toBe("sheet");
    expect(fileKindOf("photo.jpeg")).toBe("image");
    expect(fileKindOf("notes.md")).toBe("text");
    expect(fileKindOf("archive.tar.gz")).toBe("archive");
    expect(fileKindOf("Makefile")).toBe("other");
    expect(fileKindOf(".env")).toBe("other");
  });
  it("writes sizes and dates for people", () => {
    expect(formatBytes(840)).toBe("840 B");
    expect(formatBytes(12_400)).toBe("12 KB");
    expect(formatBytes(3_100_000)).toBe("3.1 MB");
    expect(formatBytes(undefined)).toBe("—");
    expect(formatWhen("2026-11-18 09:42", "2026-11-18")).toBe("09:42");
    expect(formatWhen("2026-11-12 09:42", "2026-11-18")).toBe("Nov 12");
    expect(formatWhen("2025-03-02", "2026-11-18")).toBe("Mar 2, 2025");
  });
  it("draws a decorative mark, named when it stands alone", () => {
    expect(html(h(FileTypeMark, { kind: "pdf" }))).toContain('aria-hidden="true"');
    expect(html(h(FileTypeMark, { kind: "pdf", label: "PDF" }))).toContain('aria-label="PDF"');
  });
});

describe("selection", () => {
  const order = ["a", "b", "c", "d", "e"];
  it("selects alone, toggles with ⌘, runs with ⇧", () => {
    expect(selectionAfterClick(["a", "b"], order, "c", {}, "a")).toEqual(["c"]);
    expect(selectionAfterClick(["a"], order, "c", { mod: true }, "a")).toEqual(["a", "c"]);
    expect(selectionAfterClick(["a", "c"], order, "c", { mod: true }, "a")).toEqual(["a"]);
    expect(selectionAfterClick(["b"], order, "d", { shift: true }, "b")).toEqual(["b", "c", "d"]);
    expect(selectionAfterClick(["e"], order, "c", { shift: true, mod: true }, "a")).toEqual([
      "e",
      "a",
      "b",
      "c",
    ]);
  });
  it("orders folders first, then by the key", () => {
    const items: DriveItem[] = [
      { id: "1", name: "b.pdf", size: 10 },
      { id: "2", name: "Zeta", kind: "folder" },
      { id: "3", name: "a.pdf", size: 30 },
    ];
    expect(sortDriveItems(items, { key: "name", direction: "asc" }).map((i) => i.id)).toEqual([
      "2",
      "3",
      "1",
    ]);
    expect(sortDriveItems(items, { key: "size", direction: "desc" }).map((i) => i.id)).toEqual([
      "2",
      "3",
      "1",
    ]);
  });
});

const ITEMS: DriveItem[] = [
  {
    id: "f1",
    name: "Contracts",
    kind: "folder",
    modified: "2026-11-10 10:00",
    owner: "Léa Martin",
  },
  { id: "a", name: "Dock plan.pdf", size: 240_000, modified: "2026-11-18 09:12", owner: "me" },
  { id: "b", name: "Tariffs 2027.xlsx", size: 52_000, modified: "2026-11-12 16:00" },
  { id: "c", name: "Yard.jpg", size: 1_800_000, modified: "2026-10-02 08:00", starred: true },
];

describe("FileBrowser", () => {
  it("lists folders first, with sortable headers and the selection marked", () => {
    const out = html(h(FileBrowser, { items: ITEMS, today: "2026-11-18", defaultSelected: ["b"] }));
    expect(out).toContain('role="grid"');
    expect(out).toContain('aria-multiselectable="true"');
    expect(out.indexOf("Contracts")).toBeLessThan(out.indexOf("Dock plan.pdf"));
    expect(out).toContain('aria-sort="ascending"');
    expect(out).toContain("09:12");
    expect(out).toMatch(/aria-selected="true"[^>]*>[\s\S]*?Tariffs 2027/);
  });
  it("selects by click, ⇧ click and ⌘ click, and opens on a double click", async () => {
    const onSelectedChange = vi.fn<(...args: unknown[]) => void>();
    const onOpen = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(FileBrowser, { items: ITEMS, onSelectedChange, onOpen }));
    const row = (id: string) => el.querySelector(`[data-fb-item="${id}"]`)!;
    await click(row("a"));
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a"]);
    await click(row("c"), { shiftKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b", "c"]);
    await click(row("f1"), { metaKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b", "c", "f1"]);
    await act(async () => {
      row("b").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });
    expect(onOpen).toHaveBeenCalledWith("b");
  });
  it("moves with the arrows, extends with ⇧, selects all, clears, opens, deletes", async () => {
    const onSelectedChange = vi.fn<(...args: unknown[]) => void>();
    const onOpen = vi.fn<(...args: unknown[]) => void>();
    const onDelete = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(FileBrowser, { items: ITEMS, onSelectedChange, onOpen, onDelete, defaultSelected: ["f1"] }),
    );
    const first = el.querySelector<HTMLElement>('[data-fb-item="f1"]')!;
    expect(first.tabIndex).toBe(0);
    first.focus();
    await key(first, "ArrowDown");
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a"]);
    expect(document.activeElement?.getAttribute("data-fb-item")).toBe("a");
    await key(document.activeElement!, "ArrowDown", { shiftKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b"]);
    await key(document.activeElement!, "a", { metaKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["f1", "a", "b", "c"]);
    await key(document.activeElement!, "Delete");
    expect(onDelete).toHaveBeenCalledWith(["f1", "a", "b", "c"]);
    await key(document.activeElement!, "Escape");
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
    await key(document.activeElement!, "Enter");
    expect(onOpen).toHaveBeenCalledWith("b");
  });
  it("renames in place with F2", async () => {
    const onRename = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(FileBrowser, { items: ITEMS, onRename, defaultSelected: ["a"] }));
    const row = el.querySelector<HTMLElement>('[data-fb-item="a"]')!;
    row.focus();
    await key(row, "F2");
    const input = el.querySelector<HTMLInputElement>(".fg-fbr-rename")!;
    expect(input).not.toBeNull();
    expect(input.selectionEnd).toBe("Dock plan".length);
    await typeInto(input, "Dock plan v2.pdf");
    await key(input, "Enter");
    expect(onRename).toHaveBeenCalledWith("a", "Dock plan v2.pdf");
    expect(el.querySelector(".fg-fbr-rename")).toBeNull();
  });
  it("selects the item under a right click and offers the menu of the selection", async () => {
    const menu = vi.fn<(ids: string[]) => { id: string; label: string }[]>((ids: string[]) =>
      ids.length ? [{ id: "trash", label: `Trash ${ids.length}` }] : [],
    );
    const onSelectedChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(FileBrowser, { items: ITEMS, menu, onSelectedChange }));
    await act(async () => {
      el.querySelector('[data-fb-item="b"]')!.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      );
    });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["b"]);
    expect(menu).toHaveBeenLastCalledWith(["b"]);
  });
  it("moves dragged items onto a folder and uploads files dropped on it", async () => {
    const onMove = vi.fn<(...args: unknown[]) => void>();
    const onDropFiles = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(FileBrowser, { items: ITEMS, onMove, onDropFiles }));
    const folder = el.querySelector('[data-fb-item="f1"]')!;
    expect(el.querySelector('[data-fb-item="a"]')!.getAttribute("draggable")).toBe("true");
    await drag(folder, "dragover", { types: [DRIVE_DRAG_TYPE] });
    expect(folder.className).toContain("fg-fbr-over");
    await drag(folder, "drop", {
      types: [DRIVE_DRAG_TYPE],
      get: { [DRIVE_DRAG_TYPE]: JSON.stringify(["a", "b"]) },
    });
    expect(onMove).toHaveBeenCalledWith(["a", "b"], "f1");
    const file = new File(["x"], "scan.pdf", { type: "application/pdf" });
    await drag(folder, "drop", { types: ["Files"], files: [file] });
    expect(onDropFiles).toHaveBeenCalledWith([file], "f1");
    await drag(el.querySelector(".fg-fbr")!, "drop", { types: ["Files"], files: [file] });
    expect(onDropFiles).toHaveBeenLastCalledWith([file], null);
  });
  it("shows folders and files apart in the grid, and an empty folder", () => {
    const out = html(h(FileBrowser, { items: ITEMS, layout: "grid" }));
    expect(out).toContain('aria-label="Folders"');
    expect(out).toContain('aria-label="Files"');
    expect(out).toContain("fg-fbr-paper");
    expect(html(h(FileBrowser, { items: [] }))).toContain("This folder is empty");
  });
});

const TREE: FolderNode[] = [
  {
    id: "my",
    name: "My files",
    children: [
      { id: "sales", name: "Sales", hasChildren: true },
      { id: "ops", name: "Operations", children: [] },
    ],
  },
  { id: "app", name: "Invoices", readOnly: true },
];

describe("FolderTree", () => {
  it("is a tree with levels, open state and the current folder", () => {
    const out = html(
      h(FolderTree, { folders: TREE, defaultExpanded: ["my"], defaultSelected: "ops" }),
    );
    expect(out).toContain('role="tree"');
    expect(out).toContain('aria-level="2"');
    expect(out).toContain('aria-expanded="true"');
    expect(out).toMatch(/aria-selected="true"[^>]*>[\s\S]*?Operations/);
    expect(out).toContain("Read-only");
  });
  it("walks with the arrows, opens and loads children, closes and climbs", async () => {
    const onLoadChildren = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const onOpen = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(FolderTree, { folders: TREE, onLoadChildren, onOpen }));
    const item = (id: string) => el.querySelector<HTMLElement>(`[data-folder="${id}"]`)!;
    item("my").focus();
    await key(item("my"), "ArrowRight");
    expect(item("my").getAttribute("aria-expanded")).toBe("true");
    await key(item("my"), "ArrowRight");
    expect(document.activeElement).toBe(item("sales"));
    await key(item("sales"), "ArrowRight");
    expect(onLoadChildren).toHaveBeenCalledWith("sales");
    expect(item("sales").textContent).toContain("Loading");
    await key(item("sales"), "ArrowLeft");
    await key(item("sales"), "ArrowLeft");
    expect(document.activeElement).toBe(item("my"));
    await key(item("my"), "i");
    expect(document.activeElement).toBe(item("app"));
    await key(item("app"), "Enter");
    expect(onOpen).toHaveBeenCalledWith("app");
  });
  it("takes a drop on a folder, never on a read-only one", async () => {
    const onDrop = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(FolderTree, { folders: TREE, onDrop }));
    const row = (id: string) => el.querySelector(`[data-folder="${id}"] > .fg-ftree-row`)!;
    await drag(row("app"), "drop", {
      types: [DRIVE_DRAG_TYPE],
      get: { [DRIVE_DRAG_TYPE]: '["a"]' },
    });
    expect(onDrop).not.toHaveBeenCalled();
    await drag(row("my"), "drop", {
      types: [DRIVE_DRAG_TYPE],
      get: { [DRIVE_DRAG_TYPE]: '["a"]' },
    });
    expect(onDrop).toHaveBeenCalledWith("my", { ids: ["a"], files: [] });
  });
});

describe("MovePanel", () => {
  it("picks a folder that can take the items and confirms there", async () => {
    const onConfirm = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(MovePanel, { folders: TREE, disabledIds: ["sales"], from: "My files", onConfirm }),
    );
    const button = [...el.querySelectorAll("button")].find((b) => b.textContent === "Move here")!;
    expect(button.disabled).toBe(true);
    await click(el.querySelector('[data-folder="sales"] > .fg-ftree-row')!);
    expect(button.disabled).toBe(true);
    await click(el.querySelector('[data-folder="ops"] > .fg-ftree-row')!);
    expect(el.textContent).toContain("To My files › Operations");
    await click(button);
    expect(onConfirm).toHaveBeenCalledWith("ops");
    expect(folderLabel(TREE, "sales")).toBe("My files › Sales");
  });
});

describe("SelectionBar", () => {
  it("counts, clears, runs an action and keeps the rest behind ⋯", async () => {
    const run = vi.fn<(...args: unknown[]) => void>();
    const onClear = vi.fn<(...args: unknown[]) => void>();
    expect(html(h(SelectionBar, { count: 0, onClear, actions: [] }))).toBe("");
    const el = await mount(
      h(SelectionBar, {
        count: 3,
        onClear,
        inline: 2,
        actions: [
          { id: "share", label: "Share", run },
          { id: "download", label: "Download" },
          { id: "trash", label: "Move to trash", danger: true },
        ],
      }),
    );
    expect(el.textContent).toContain("3 selected");
    await click([...el.querySelectorAll("button")].find((b) => b.textContent === "Share")!);
    expect(run).toHaveBeenCalled();
    expect(el.querySelector('[aria-label="More actions"]')).not.toBeNull();
    expect(el.textContent).not.toContain("Move to trash");
    await key(el.querySelector('[role="toolbar"]')!, "Escape");
    expect(onClear).toHaveBeenCalled();
  });
});

describe("DropZone and UploadQueue", () => {
  it("accepts files by extension and family", () => {
    expect(acceptsFile({ name: "a.PDF", type: "" }, ".pdf")).toBe(true);
    expect(acceptsFile({ name: "a.png", type: "image/png" }, ".pdf, image/*")).toBe(true);
    expect(acceptsFile({ name: "a.zip", type: "application/zip" }, ".pdf,image/*")).toBe(false);
    expect(acceptsFile({ name: "a.zip", type: "" })).toBe(true);
  });
  it("passes the dropped files that match, and the others apart", async () => {
    const onFiles = vi.fn<(...args: unknown[]) => void>();
    const onReject = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(DropZone, { onFiles, onReject, accept: ".pdf" }));
    const zone = el.querySelector(".fg-dropzone")!;
    const ok = new File(["x"], "a.pdf");
    const bad = new File(["x"], "b.exe");
    await drag(zone, "dragenter", { types: ["Files"] });
    expect(zone.className).toContain("fg-dropzone-active");
    await drag(zone, "drop", { types: ["Files"], files: [ok, bad] });
    expect(onFiles).toHaveBeenCalledWith([ok]);
    expect(onReject).toHaveBeenCalledWith([bad]);
    expect(zone.className).not.toContain("fg-dropzone-active");
  });
  it("follows each file, with cancel and retry", async () => {
    const onCancel = vi.fn<(...args: unknown[]) => void>();
    const onRetry = vi.fn<(...args: unknown[]) => void>();
    const items = [
      { id: "1", name: "a.pdf", size: 1000, progress: 1, status: "done" as const },
      { id: "2", name: "b.png", size: 2000, progress: 0.4, status: "uploading" as const },
      {
        id: "3",
        name: "c.zip",
        size: 3000,
        progress: 0,
        status: "failed" as const,
        error: "Too large",
      },
    ];
    expect(uploadSummary(items)).toBe("Uploading 3 of 3");
    expect(uploadSummary([items[0]!, items[2]!])).toBe("1 failed, 1 uploaded");
    const el = await mount(h(UploadQueue, { items, onCancel, onRetry }));
    expect(el.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("40");
    expect(el.textContent).toContain("Too large");
    await click(el.querySelector('[aria-label="Cancel b.png"]')!);
    expect(onCancel).toHaveBeenCalledWith("2");
    await click(el.querySelector('[aria-label="Retry c.zip"]')!);
    expect(onRetry).toHaveBeenCalledWith("3");
    await click(el.querySelector('[aria-label="Hide uploads"]')!);
    expect(el.querySelector(".fg-upq-list")).toBeNull();
  });
});

describe("StorageMeter", () => {
  it("is a meter with the total in words, and says when it is over the budget", () => {
    const out = html(
      h(StorageMeter, {
        quota: 100e9,
        parts: [
          { label: "My files", bytes: 12e9 },
          { label: "Team drives", bytes: 30e9 },
        ],
      }),
    );
    expect(out).toContain('role="meter"');
    expect(out).toContain('aria-valuetext="42 GB of 100 GB"');
    expect(out).toContain("Team drives");
    const over = html(h(StorageMeter, { quota: 10e9, parts: [{ label: "All", bytes: 12e9 }] }));
    expect(over).toContain("over the budget");
    expect(over).toContain("fg-blockbar-danger");
  });
});

describe("FilePreview", () => {
  it("draws the file and goes to its neighbours with the arrows", async () => {
    const onPrevious = vi.fn<(...args: unknown[]) => void>();
    const onNext = vi.fn<(...args: unknown[]) => void>();
    const onClose = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(FilePreview, {
        name: "photo.png",
        src: "data:image/png;base64,AA==",
        onPrevious,
        onNext,
        onClose,
        position: { index: 2, total: 5 },
      }),
    );
    expect(el.querySelector("img")!.getAttribute("alt")).toBe("photo.png");
    expect(el.textContent).toContain("2 / 5");
    const stage = el.querySelector(".fg-fpv-stage")!;
    await key(stage, "ArrowRight");
    await key(stage, "ArrowLeft");
    await key(stage, "Escape");
    expect(onNext).toHaveBeenCalled();
    expect(onPrevious).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
  it("says when there is no preview, and lists an archive", () => {
    expect(html(h(FilePreview, { name: "setup.bin", size: 2000 }))).toContain(
      "No preview for this file",
    );
    const out = html(
      h(FilePreview, {
        name: "a.zip",
        entries: [{ name: "x.txt", size: 10 }],
        onDownload: () => {},
      }),
    );
    expect(out).toContain("x.txt");
    expect(out).toContain("Download");
    expect(html(h(FilePreview, { name: "readme.md", text: "# Hello" }))).toContain("# Hello");
  });
});

describe("FileDetails", () => {
  it("shows access and properties, and the versions in their tab", async () => {
    const onRestoreVersion = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(FileDetails, {
        name: "Dock plan.pdf",
        size: 240_000,
        owner: "Léa Martin",
        modified: "Nov 18, 2026 · 09:12",
        access: {
          people: ["Léa Martin", "Hugo Bernard"],
          scope: "link",
          summary: "Anyone with the link can view",
        },
        versions: [
          { id: "v2", label: "v2", at: "Nov 18, 2026", by: "Léa Martin" },
          { id: "v1", label: "v1", at: "Nov 2, 2026", by: "Hugo Bernard", note: "Uploaded" },
        ],
        onRestoreVersion,
      }),
    );
    expect(el.textContent).toContain("Léa Martin and 1 more");
    expect(el.textContent).toContain("Anyone with the link can view");
    expect(el.textContent).toContain("240 KB");
    await click(
      [...el.querySelectorAll('[role="tab"]')].find((t) => t.textContent === "Versions")!,
    );
    expect(el.textContent).toContain("Current version");
    await click([...el.querySelectorAll("button")].find((b) => b.textContent === "Restore")!);
    expect(onRestoreVersion).toHaveBeenCalledWith("v1");
  });
});

describe("SharePanel", () => {
  const directory = [
    { id: "hb", name: "Hugo Bernard", hint: "Engineering" },
    { id: "np", name: "Nadia Petit", hint: "Finance" },
  ];
  it("adds a person from the list with the keyboard", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(h(SharePanel, { directory, onChange }));
    const input = el.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await act(async () => input.focus());
    await typeInto(input, "nad");
    expect(el.querySelectorAll('[role="option"]')).toHaveLength(1);
    await key(input, "Enter");
    const next = onChange.mock.lastCall![0] as ShareSettings;
    expect(next.people).toEqual([{ id: "np", role: "editor" }]);
    expect(el.textContent).toContain("Nadia Petit");
  });
  it("shows the link settings when anyone with the link can open it", async () => {
    const onChange = vi.fn<(...args: unknown[]) => void>();
    const el = await mount(
      h(SharePanel, {
        directory,
        organization: "Atelier Moreau",
        linkUrl: "https://drive.example/s/abc",
        onChange,
        defaultValue: {
          people: [],
          general: "link",
          generalRole: "viewer",
          link: { expires: "never", password: false, download: true },
        },
      }),
    );
    expect(el.querySelector<HTMLInputElement>('[aria-label="Share link"]')!.value).toBe(
      "https://drive.example/s/abc",
    );
    const sw = [...el.querySelectorAll<HTMLInputElement>('[role="switch"]')][0]!;
    await click(sw);
    expect((onChange.mock.lastCall![0] as ShareSettings).link.password).toBe(true);
    expect(el.querySelector('[aria-label="Link password"]')).not.toBeNull();
  });
});
