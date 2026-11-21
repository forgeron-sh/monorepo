// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adminDay,
  adminDaysBetween,
  bulkTarget,
  classifyInvites,
  columnCells,
  ExportDialog,
  exportFilename,
  exportPercent,
  exportProblem,
  gridMove,
  InviteDialog,
  inviteSummary,
  isInviteEmail,
  nextPermissionState,
  normalizeEmail,
  parseEmails,
  PermissionMatrix,
  permissionAt,
  permissionDiff,
  permissionKey,
  permissionSummary,
  relativeDay,
  retentionDaysLeft,
  retentionText,
  rowCells,
  SECRET_MASK,
  SecretField,
  secondsLeft,
  secretProblem,
  setPermission,
  setPermissions,
  sharedState,
  sortByRetention,
  toggleIn,
  TrashList,
  type PermissionColumn,
  type PermissionSubject,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
afterEach(() => {
  host?.remove();
  host = undefined;
  vi.useRealTimers();
  vi.restoreAllMocks();
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
const click = async (el: Element | null | undefined) => {
  expect(el).toBeTruthy();
  await act(async () => (el as HTMLElement).click());
};
const typeInto = async (el: HTMLInputElement | HTMLTextAreaElement, value: string) =>
  act(async () => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
const byText = (root: ParentNode, selector: string, text: string) =>
  [...root.querySelectorAll<HTMLElement>(selector)].find((e) => e.textContent?.trim() === text);
const byLabel = (root: ParentNode, label: string) =>
  root.querySelector<HTMLElement>(`[aria-label="${label}"]`);
/** Dialogs render in place, in the host. */
const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);

/* ---------------------------------------------------------------- model */

describe("shared helpers", () => {
  it("reads days from stamps", () => {
    expect(adminDay("2026-11-18T09:12:00Z")).toBe("2026-11-18");
    expect(adminDay("nope")).toBeNull();
    expect(adminDaysBetween("2026-11-18", "2026-11-21 10:00")).toBe(3);
    expect(relativeDay("2026-11-18", "2026-11-19")).toBe("yesterday");
    expect(relativeDay("2026-11-12", "2026-11-19")).toBe("7 days ago");
    expect(relativeDay("2026-11-21", "2026-11-19")).toBe("in 2 days");
  });

  it("toggles a value in a list without mutating it", () => {
    const list = ["a"];
    expect(toggleIn(list, "b")).toEqual(["a", "b"]);
    expect(toggleIn(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleIn(list, "a", true)).toEqual(["a"]);
    expect(list).toEqual(["a"]);
  });
});

const subjects: PermissionSubject[] = [
  { id: "ada", name: "Ada Lovelace", kind: "person" },
  { id: "ops", name: "Ops team", kind: "team", hint: "4 members" },
];
const columns: PermissionColumn[] = [
  { id: "inv.read", label: "Read", group: "Invoices" },
  { id: "inv.write", label: "Write", group: "Invoices" },
  { id: "usr.read", label: "Read", group: "People" },
];

describe("permission model", () => {
  it("cycles inherit, allow, deny", () => {
    expect(nextPermissionState("inherit")).toBe("allow");
    expect(nextPermissionState("allow")).toBe("deny");
    expect(nextPermissionState("deny")).toBe("inherit");
  });

  it("keeps inherited cells out of the value", () => {
    const a = setPermission({}, "ada", "inv.read", "allow");
    expect(a).toEqual({ [permissionKey("ada", "inv.read")]: "allow" });
    expect(permissionAt(a, "ada", "inv.read")).toBe("allow");
    expect(permissionAt(a, "ada", "inv.write")).toBe("inherit");
    expect(setPermission(a, "ada", "inv.read", "inherit")).toEqual({});
    expect(setPermission(a, "ada", "inv.read", "allow")).toBe(a);
  });

  it("sets a row or a column at once and tells what they share", () => {
    const row = rowCells("ada", columns);
    const all = setPermissions({}, row, "allow");
    expect(sharedState(all, row)).toBe("allow");
    expect(sharedState(all, columnCells("inv.read", subjects))).toBe("mixed");
    expect(bulkTarget("mixed")).toBe("allow");
    expect(bulkTarget("inherit")).toBe("allow");
    expect(bulkTarget("allow")).toBe("deny");
    expect(bulkTarget("deny")).toBe("inherit");
  });

  it("finds what differs from the saved grid", () => {
    const saved = setPermission({}, "ada", "inv.read", "allow");
    const edited = setPermission(
      setPermission(saved, "ada", "inv.read", "deny"),
      "ops",
      "usr.read",
      "allow",
    );
    expect(permissionDiff(saved, edited, subjects, columns)).toEqual([
      { subjectId: "ada", columnId: "inv.read", from: "allow", to: "deny" },
      { subjectId: "ops", columnId: "usr.read", from: "inherit", to: "allow" },
    ]);
    expect(permissionDiff(saved, saved, subjects, columns)).toEqual([]);
  });

  it("writes the grid in words", () => {
    let v = setPermission({}, "ada", "inv.read", "allow");
    v = setPermission(v, "ada", "inv.write", "deny");
    const [ada, ops] = permissionSummary(v, subjects, columns);
    expect(ada!.text).toBe(
      "Ada Lovelace, allowed: Invoices Read; denied: Invoices Write; 1 inherited.",
    );
    expect(ops!.text).toBe("Ops team, 3 inherited.");
  });

  it("moves in a grid and stops at its edges", () => {
    const size = { rows: 3, cols: 4 };
    expect(gridMove({ row: 1, col: 1 }, "ArrowRight", size)).toEqual({ row: 1, col: 2 });
    expect(gridMove({ row: 1, col: 3 }, "ArrowRight", size)).toEqual({ row: 1, col: 3 });
    expect(gridMove({ row: 0, col: 1 }, "ArrowUp", size)).toEqual({ row: 0, col: 1 });
    expect(gridMove({ row: 1, col: 2 }, "Home", size)).toEqual({ row: 1, col: 0 });
    expect(gridMove({ row: 1, col: 2 }, "End", size, true)).toEqual({ row: 2, col: 3 });
    expect(gridMove({ row: 1, col: 2 }, "x", size)).toBeNull();
  });
});

describe("invitation model", () => {
  it("reads addresses from a paste", () => {
    expect(parseEmails("a@x.io, Bob <B@x.io>\nA@x.io;  c@x.io")).toEqual([
      "a@x.io",
      "b@x.io",
      "c@x.io",
    ]);
    expect(normalizeEmail("  Ann <ANN@Mail.com> ")).toBe("ann@mail.com");
  });

  it("checks an address", () => {
    expect(isInviteEmail("a@x.io")).toBe(true);
    expect(isInviteEmail("a@x")).toBe(false);
    expect(isInviteEmail("a b@x.io")).toBe(false);
  });

  it("tells invited, members and invalid apart", () => {
    const r = classifyInvites(["new@x.io", "Old@x.io", "nope", "new@x.io"], ["old@x.io"]);
    expect(r).toEqual([
      { email: "new@x.io", outcome: "invited" },
      { email: "old@x.io", outcome: "member" },
      { email: "nope", outcome: "invalid" },
    ]);
    expect(inviteSummary(r)).toBe("1 invited, 1 already a member, 1 invalid");
    expect(inviteSummary([])).toBe("Nobody invited");
  });
});

describe("secret, export and trash models", () => {
  it("counts down and checks a new secret", () => {
    expect(secondsLeft(1000, 3500)).toBe(3);
    expect(secondsLeft(5000, 3500)).toBe(0);
    expect(secretProblem("")).not.toBeNull();
    expect(secretProblem("a\nb")).not.toBeNull();
    expect(secretProblem("fg_test_xxxxxxxx")).toBeNull();
  });

  it("checks an export", () => {
    expect(exportProblem({ format: "csv", columns: [], range: "all" })).toContain("column");
    expect(
      exportProblem({ format: "csv", columns: ["a"], range: "x" }, [
        { value: "x", label: "X", count: 0 },
      ]),
    ).toContain("Nothing");
    expect(exportProblem({ format: "csv", columns: ["a"], range: "all" })).toBeNull();
    expect(exportFilename("Team members", "CSV", "2026-11-19T10:00")).toBe(
      "team-members-2026-11-19.csv",
    );
    expect(exportPercent({ status: "running", progress: 0.456 })).toBe(46);
    expect(exportPercent({ status: "running" })).toBeNull();
    expect(exportPercent({ status: "done" })).toBe(100);
  });

  it("counts the days the trash keeps an item", () => {
    expect(retentionDaysLeft("2026-11-10", "2026-11-19", 30)).toBe(21);
    expect(retentionText(1)).toBe("1 day left");
    expect(retentionText(0)).toBe("Goes today");
    const sorted = sortByRetention([
      { id: "new", name: "N", deletedBy: "x", deletedAt: "2026-11-18" },
      { id: "old", name: "O", deletedBy: "x", deletedAt: "2026-10-30" },
    ]);
    expect(sorted.map((x) => x.id)).toEqual(["old", "new"]);
  });
});

/* ---------------------------------------------------------------- PermissionMatrix */

describe("PermissionMatrix", () => {
  const props = { label: "Permissions", subjects, columns };
  const cell = (root: ParentNode, r: number, c: number) =>
    root.querySelector<HTMLElement>(`[data-r="${r}"][data-c="${c}"]`)!;

  it("renders a grid with names, states in words and one tab stop", () => {
    const out = html(h(PermissionMatrix, props));
    expect(out).toContain('role="grid"');
    expect(out).toContain("Ada Lovelace");
    expect(out).toContain("Ada Lovelace, Invoices Read: Inherited");
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
  });

  it("cycles a cell on click and Space, and reports the value", async () => {
    const onChange = vi.fn<(v: unknown) => void>();
    const root = await mount(h(PermissionMatrix, { ...props, onChange }));
    await click(cell(root, 1, 1));
    expect(onChange).toHaveBeenLastCalledWith({ [permissionKey("ada", "inv.read")]: "allow" });
    await key(cell(root, 1, 1), " ");
    expect(cell(root, 1, 1).dataset.state).toBe("deny");
    await key(cell(root, 1, 1), "Enter");
    expect(cell(root, 1, 1).dataset.state).toBe("inherit");
  });

  it("sets a state with A, D and I", async () => {
    const root = await mount(h(PermissionMatrix, props));
    await key(cell(root, 2, 2), "a");
    expect(cell(root, 2, 2).dataset.state).toBe("allow");
    await key(cell(root, 2, 2), "d");
    expect(cell(root, 2, 2).dataset.state).toBe("deny");
    await key(cell(root, 2, 2), "i");
    expect(cell(root, 2, 2).dataset.state).toBe("inherit");
  });

  it("moves the focus with the arrows, headers included", async () => {
    const root = await mount(h(PermissionMatrix, props));
    await act(async () => cell(root, 1, 1).focus());
    await key(cell(root, 1, 1), "ArrowRight");
    expect(document.activeElement).toBe(cell(root, 1, 2));
    await key(cell(root, 1, 2), "ArrowUp");
    expect(document.activeElement).toBe(cell(root, 0, 2));
    await key(cell(root, 0, 2), "ArrowLeft");
    await key(cell(root, 0, 1), "ArrowLeft");
    expect(document.activeElement).toBe(cell(root, 0, 1));
    await key(cell(root, 0, 1), "ArrowDown");
    await key(cell(root, 1, 1), "ArrowLeft");
    expect(document.activeElement).toBe(cell(root, 1, 0));
    await key(cell(root, 1, 0), "End");
    expect(document.activeElement).toBe(cell(root, 1, 3));
  });

  it("sets a whole column or row from its header", async () => {
    const root = await mount(h(PermissionMatrix, props));
    await key(cell(root, 0, 1), "Enter");
    expect(cell(root, 1, 1).dataset.state).toBe("allow");
    expect(cell(root, 2, 1).dataset.state).toBe("allow");
    expect(cell(root, 1, 2).dataset.state).toBe("inherit");
    await click(cell(root, 1, 0));
    expect([1, 2, 3].map((c) => cell(root, 1, c).dataset.state)).toEqual([
      "allow",
      "allow",
      "allow",
    ]);
    await click(cell(root, 1, 0));
    expect([1, 2, 3].map((c) => cell(root, 1, c).dataset.state)).toEqual(["deny", "deny", "deny"]);
  });

  it("changes nothing when read only", async () => {
    const onChange = vi.fn<(arg?: unknown) => void>();
    const root = await mount(h(PermissionMatrix, { ...props, readOnly: true, onChange }));
    await click(cell(root, 1, 1));
    await key(cell(root, 1, 1), "a");
    await key(cell(root, 0, 1), "Enter");
    expect(onChange).not.toHaveBeenCalled();
    expect(root.querySelector("[role=grid]")!.getAttribute("aria-readonly")).toBe("true");
  });

  it("marks cells that differ from the saved value, and lists them in the summary", async () => {
    const saved = { [permissionKey("ada", "inv.read")]: "allow" as const };
    const root = await mount(
      h(PermissionMatrix, { ...props, defaultValue: saved, saved, summaryOpen: true }),
    );
    expect(root.querySelector("[data-changed]")).toBeNull();
    await key(cell(root, 1, 1), "d");
    expect(cell(root, 1, 1).dataset.changed).toBe("true");
    expect(cell(root, 1, 1).getAttribute("aria-label")).toContain("unsaved change");
    expect(root.textContent).toContain("1 unsaved change");
    expect(root.textContent).toContain("Ada Lovelace, Invoices Read: allowed to denied.");
  });

  it("opens a text summary of the grid", async () => {
    const root = await mount(
      h(PermissionMatrix, {
        ...props,
        defaultValue: { [permissionKey("ops", "usr.read")]: "deny" },
      }),
    );
    expect(root.querySelector(".fg-adm-pm-summary-body")).toBeNull();
    await click(byText(root, "button", "Text summary"));
    expect(root.querySelector(".fg-adm-pm-summary-body")!.textContent).toContain(
      "Ops team, denied: People Read; 2 inherited.",
    );
  });
});

/* ---------------------------------------------------------------- InviteDialog */

describe("InviteDialog", () => {
  const teams = [{ value: "ops", label: "Ops" }];

  it("sends the valid new addresses and leaves the others out", async () => {
    const onInvite = vi.fn<(arg?: unknown) => void>();
    await mount(
      h(InviteDialog, {
        teams,
        members: ["old@x.io"],
        defaultValue: {
          emails: ["new@x.io", "OLD@x.io", "nope"],
          teams: ["ops"],
          message: " Welcome ",
        },
        onInvite,
        onClose: () => {},
      }),
    );
    const text = q("[role=dialog]")!.textContent!;
    expect(text).toContain("1 invitation to send");
    expect(text).toContain("1 already a member, left out");
    expect(text).toContain("1 not valid, left out");
    await click(byText(document, "button", "Invite"));
    expect(onInvite).toHaveBeenCalledWith({
      emails: ["new@x.io"],
      teams: ["ops"],
      message: "Welcome",
    });
  });

  it("will not send with nothing to invite", async () => {
    await mount(
      h(InviteDialog, {
        defaultValue: { emails: ["nope"], teams: [], message: "" },
        onInvite: () => {},
        onClose: () => {},
      }),
    );
    expect((byText(document, "button", "Invite") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the result of each address, then goes back", async () => {
    const onAgain = vi.fn<(arg?: unknown) => void>();
    await mount(
      h(InviteDialog, {
        onInvite: () => {},
        onClose: () => {},
        onAgain,
        result: [
          { email: "a@x.io", outcome: "invited" },
          { email: "b@x.io", outcome: "member" },
          { email: "c", outcome: "invalid", detail: "Not an address" },
        ],
      }),
    );
    const dialog = q("[role=dialog]")!;
    expect(dialog.textContent).toContain("1 invited, 1 already a member, 1 invalid");
    expect(dialog.querySelectorAll("li")).toHaveLength(3);
    expect(dialog.textContent).toContain("Already a member");
    await click(byText(document, "button", "Invite more"));
    expect(onAgain).toHaveBeenCalled();
  });
});

/* ---------------------------------------------------------------- SecretField */

describe("SecretField", () => {
  const SECRET = "fg_test_xxxxxxxx";

  it("keeps the value out of the page while it is hidden", async () => {
    const root = await mount(
      h(SecretField, {
        label: "Signing secret",
        isSet: true,
        value: SECRET,
        rotatedAt: "2026-11-01",
        today: "2026-11-19",
      }),
    );
    expect(root.innerHTML).not.toContain(SECRET);
    expect(root.textContent).toContain(SECRET_MASK);
    expect(root.textContent).toContain("Changed 18 days ago");
    const other = html(
      h(SecretField, {
        label: "S",
        isSet: true,
        getValue: () => "a-much-much-longer-secret-value",
      }),
    );
    expect(other).toContain(SECRET_MASK);
    expect(other).not.toContain("much");
  });

  it("reveals on demand and hides again", async () => {
    const root = await mount(
      h(SecretField, { label: "Signing secret", isSet: true, getValue: async () => SECRET }),
    );
    await click(byLabel(root, "Reveal Signing secret"));
    expect(root.textContent).toContain(SECRET);
    expect(root.textContent).not.toContain(SECRET_MASK);
    await click(byLabel(root, "Hide Signing secret"));
    expect(root.innerHTML).not.toContain(SECRET);
  });

  it("hides the value by itself after the timeout", async () => {
    vi.useFakeTimers({
      toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"],
    });
    const root = await mount(
      h(SecretField, { label: "Signing secret", isSet: true, value: SECRET, revealTimeout: 1000 }),
    );
    await click(byLabel(root, "Reveal Signing secret"));
    expect(root.textContent).toContain(SECRET);
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(root.innerHTML).not.toContain(SECRET);
    expect(root.querySelector("[role=status]")!.textContent).toBe("Secret hidden.");
  });

  it("copies without revealing", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const onCopy = vi.fn<(arg?: unknown) => void>();
    const root = await mount(
      h(SecretField, { label: "Signing secret", isSet: true, value: SECRET, onCopy }),
    );
    await click(byLabel(root, "Copy Signing secret"));
    expect(writeText).toHaveBeenCalledWith(SECRET);
    expect(onCopy).toHaveBeenCalled();
    expect(root.innerHTML).not.toContain(SECRET);
  });

  it("replaces the value and never keeps the new one", async () => {
    const onReplace = vi.fn<(arg?: unknown) => void>();
    const root = await mount(
      h(SecretField, { label: "Signing secret", isSet: true, value: SECRET, onReplace }),
    );
    await click(byLabel(root, "Replace Signing secret"));
    const input = root.querySelector<HTMLInputElement>("input[type=password]")!;
    expect(input.autocomplete).toBe("new-password");
    await act(async () =>
      root
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(root.textContent).toContain("Type the new value.");
    expect(onReplace).not.toHaveBeenCalled();
    await typeInto(input, "fg_test_new_value");
    await act(async () =>
      root
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(onReplace).toHaveBeenCalledWith("fg_test_new_value");
    expect(root.innerHTML).not.toContain("fg_test_new_value");
    expect(root.querySelector("input")).toBeNull();
  });

  it("says when nothing is set, and offers to set it", async () => {
    const root = await mount(
      h(SecretField, { label: "Signing secret", isSet: false, onReplace: () => {} }),
    );
    expect(root.textContent).toContain("Not set");
    expect(root.textContent).not.toContain(SECRET_MASK);
    expect(byText(root, "button", "Set value")).toBeTruthy();
  });

  it("asks twice before removing", async () => {
    const onRemove = vi.fn<(arg?: unknown) => void>();
    const root = await mount(
      h(SecretField, { label: "Signing secret", isSet: true, value: SECRET, onRemove }),
    );
    await click(byLabel(root, "Remove Signing secret"));
    expect(onRemove).not.toHaveBeenCalled();
    await click(byText(root, ".fg-adm-secret-confirm button", "Remove"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

/* ---------------------------------------------------------------- ExportDialog */

describe("ExportDialog", () => {
  const cols = [
    { id: "name", label: "Name" },
    { id: "email", label: "Email", hint: "personal" },
    { id: "role", label: "Team" },
  ];
  const ranges = [
    { value: "all", label: "Everything", count: 1284 },
    { value: "filtered", label: "Filtered", count: 12 },
  ];

  it("exports the chosen columns, in order", async () => {
    const onExport = vi.fn<(arg?: unknown) => void>();
    await mount(
      h(ExportDialog, {
        columns: cols,
        ranges,
        name: "Members",
        today: "2026-11-19",
        onExport,
        onClose: () => {},
      }),
    );
    expect(q("[role=dialog]")!.textContent).toContain("1,284");
    const box = (label: string) =>
      byText(document, "label", label)!.querySelector<HTMLInputElement>("input")!;
    await click(box("Email personal"));
    expect(q("[role=dialog]")!.textContent).toContain(
      "1,284 rows, 2 columns · members-2026-11-19.csv",
    );
    await click(byText(document, "button", "Export"));
    expect(onExport).toHaveBeenCalledWith({
      format: "csv",
      columns: ["name", "role"],
      range: "all",
    });
  });

  it("will not start without a column", async () => {
    const onExport = vi.fn<(arg?: unknown) => void>();
    await mount(h(ExportDialog, { columns: cols, onExport, onClose: () => {} }));
    await click(byText(document, "button", "Select none"));
    expect((byText(document, "button", "Export") as HTMLButtonElement).disabled).toBe(true);
    expect(q("[role=dialog]")!.textContent).toContain("Choose at least one column.");
  });

  it("shows progress, then the download", async () => {
    const onCancel = vi.fn<(arg?: unknown) => void>();
    const root = await mount(
      h(ExportDialog, {
        columns: cols,
        onExport: () => {},
        onClose: () => {},
        onCancel,
        state: { status: "running", progress: 0.4 },
      }),
    );
    expect(q("[role=progressbar]")!.getAttribute("aria-valuenow")).toBe("40");
    expect(q("fieldset")!.hasAttribute("disabled")).toBe(true);
    await click(byText(document, "button", "Cancel export"));
    expect(onCancel).toHaveBeenCalled();
    await act(async () =>
      createRoot(root).render(
        h(ExportDialog, {
          columns: cols,
          onExport: () => {},
          onClose: () => {},
          state: { status: "done", href: "#file", rows: 12, size: "3 KB", filename: "m.csv" },
        }),
      ),
    );
    expect(q("[role=dialog]")!.textContent).toContain("Export ready");
    expect(q<HTMLAnchorElement>("a[download]")!.getAttribute("href")).toBe("#file");
  });

  it("says why an export failed and offers another try", async () => {
    await mount(
      h(ExportDialog, {
        columns: cols,
        onExport: () => {},
        onClose: () => {},
        state: { status: "error", message: "Timed out" },
      }),
    );
    expect(q("[role=alert]")!.textContent).toContain("Timed out");
    expect(byText(document, "button", "Try again")).toBeTruthy();
  });
});

/* ---------------------------------------------------------------- TrashList */

describe("TrashList", () => {
  const items = [
    { id: "a", name: "Invoice 214", kind: "Invoice", deletedBy: "Ada", deletedAt: "2026-11-18" },
    { id: "b", name: "Old plan", kind: "Doc", deletedBy: "Sam", deletedAt: "2026-10-22" },
  ];
  const base = { items, today: "2026-11-19", onRestore: () => {}, onDeleteForever: () => {} };

  it("lists the soonest to go first, with who, when and days left", () => {
    const out = html(h(TrashList, base));
    expect(out.indexOf("Old plan")).toBeLessThan(out.indexOf("Invoice 214"));
    expect(out).toContain("deleted by Ada, yesterday");
    expect(out).toContain("29 days left");
    expect(out).toContain("2 days left");
    expect(out).toContain("30 days");
  });

  it("restores at once", async () => {
    const onRestore = vi.fn<(arg?: unknown) => void>();
    const root = await mount(h(TrashList, { ...base, onRestore }));
    await click(byLabel(root, "Restore Invoice 214"));
    expect(onRestore).toHaveBeenCalledWith(["a"]);
  });

  it("deletes forever only after a confirmation", async () => {
    const onDeleteForever = vi.fn<(arg?: unknown) => void>();
    const root = await mount(h(TrashList, { ...base, onDeleteForever }));
    await click(byLabel(root, "Delete Invoice 214 forever"));
    expect(onDeleteForever).not.toHaveBeenCalled();
    expect(q("[role=alertdialog]")!.textContent).toContain("Delete “Invoice 214” forever?");
    await click(byText(document, "button", "Cancel"));
    expect(onDeleteForever).not.toHaveBeenCalled();
    await click(byLabel(root, "Delete Invoice 214 forever"));
    await click(byText(document, ".fg-dialog button", "Delete forever"));
    expect(onDeleteForever).toHaveBeenCalledWith(["a"]);
  });

  it("acts on a selection, and empties after a confirmation", async () => {
    const onRestore = vi.fn<(arg?: unknown) => void>();
    const onEmpty = vi.fn<(arg?: unknown) => void>();
    const root = await mount(h(TrashList, { ...base, onRestore, onEmpty }));
    await click(root.querySelector(".fg-adm-trash-head input"));
    expect(root.textContent).toContain("2 selected");
    await click(byText(root, "button", "Restore selected"));
    expect(onRestore).toHaveBeenCalledWith(["b", "a"]);
    await click(byText(root, "button", "Empty trash"));
    expect(onEmpty).not.toHaveBeenCalled();
    await click(byText(document, ".fg-dialog button", "Empty trash"));
    expect(onEmpty).toHaveBeenCalledTimes(1);
  });

  it("selects one row and offers the bulk actions", async () => {
    const root = await mount(h(TrashList, base));
    await click(root.querySelector(".fg-adm-trash-row input"));
    expect(root.textContent).toContain("1 selected");
    expect(byText(root, "button", "Delete selected")).toBeTruthy();
  });

  it("says when it is empty", () => {
    const out = html(h(TrashList, { ...base, items: [], onEmpty: () => {} }));
    expect(out).toContain("The trash is empty.");
    expect(out).toContain("disabled");
  });
});
