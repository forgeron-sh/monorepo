// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adminDay,
  adminDaysBetween,
  bulkTarget,
  canRedeliver,
  channelCoverage,
  classifyInvites,
  columnCells,
  DeliveryLog,
  EndpointList,
  ExportDialog,
  exportFilename,
  exportPercent,
  exportProblem,
  expiryDay,
  filterDeliveries,
  formatDeliveryDuration,
  gridMove,
  groupEvents,
  inQuietHours,
  InviteDialog,
  inviteSummary,
  isInviteEmail,
  nextPermissionState,
  normalizeEmail,
  NotificationPreferences,
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
  samePrefs,
  SECRET_MASK,
  SecretField,
  secondsLeft,
  secretProblem,
  setChannel,
  setChannelForEvents,
  setPermission,
  setPermissions,
  sharedState,
  sortByRetention,
  TokenManager,
  tokenExpiry,
  tokenExpiryText,
  tokenProblems,
  toggleIn,
  TrashList,
  visibleScopes,
  type ApiToken,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationPrefs,
  type PermissionColumn,
  type PermissionSubject,
  type WebhookDelivery,
  type WebhookEndpoint,
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

const events: NotificationEvent[] = [
  { id: "mention", label: "Someone mentions you", group: "Activity" },
  { id: "assign", label: "Assigned to you", group: "Activity" },
  { id: "invoice", label: "An invoice is paid", group: "Billing" },
];
const channels: NotificationChannel[] = [
  { id: "email", label: "Email" },
  { id: "push", label: "Push" },
];

describe("notification model", () => {
  const empty: NotificationPrefs = {
    channels: {},
    digest: "off",
    quiet: { enabled: false, from: "22:00", to: "07:00" },
  };

  it("turns channels on for an event or a group, and counts coverage", () => {
    const one = setChannel(empty, "mention", "email", true);
    expect(channelCoverage(one, ["mention", "assign"], "email")).toBe("some");
    const both = setChannelForEvents(one, ["mention", "assign"], "email", true);
    expect(channelCoverage(both, ["mention", "assign"], "email")).toBe("all");
    expect(
      channelCoverage(
        setChannelForEvents(both, ["mention", "assign"], "email", false),
        ["mention"],
        "email",
      ),
    ).toBe("none");
  });

  it("groups events in order, ungrouped first", () => {
    const groups = groupEvents([
      { id: "a", label: "A", group: "X" },
      { id: "b", label: "B" },
      { id: "c", label: "C", group: "X" },
    ]);
    expect(groups.map((g) => [g.group, g.events.map((e) => e.id)])).toEqual([
      [null, ["b"]],
      ["X", ["a", "c"]],
    ]);
  });

  it("compares preferences whatever the order", () => {
    const a = setChannel(setChannel(empty, "mention", "email", true), "mention", "push", true);
    const b = setChannel(setChannel(empty, "mention", "push", true), "mention", "email", true);
    expect(samePrefs(a, b)).toBe(true);
    expect(samePrefs(a, { ...b, digest: "daily" })).toBe(false);
  });

  it("finds quiet hours, past midnight too", () => {
    const night = { enabled: true, from: "22:00", to: "07:00" };
    expect(inQuietHours(night, "23:30")).toBe(true);
    expect(inQuietHours(night, "06:59")).toBe(true);
    expect(inQuietHours(night, "07:00")).toBe(false);
    expect(inQuietHours(night, "12:00")).toBe(false);
    expect(inQuietHours({ enabled: true, from: "12:00", to: "14:00" }, "13:00")).toBe(true);
    expect(inQuietHours({ ...night, enabled: false }, "23:30")).toBe(false);
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

describe("token model", () => {
  it("finds the expiry", () => {
    expect(tokenExpiry({}, "2026-11-19")).toEqual({ state: "never" });
    expect(tokenExpiry({ expiresAt: "2026-12-30" }, "2026-11-19")).toMatchObject({
      state: "active",
    });
    expect(tokenExpiry({ expiresAt: "2026-11-22" }, "2026-11-19")).toEqual({
      state: "soon",
      days: 3,
    });
    expect(tokenExpiry({ expiresAt: "2026-11-10" }, "2026-11-19")).toMatchObject({
      state: "expired",
    });
    expect(tokenExpiryText({ expiresAt: "2026-11-10" }, "2026-11-19")).toBe("Expired 9 days ago");
    expect(tokenExpiryText({ expiresAt: "2026-11-20" }, "2026-11-19")).toBe("In 1 day");
    expect(expiryDay("2026-11-19", 30)).toBe("2026-12-19");
    expect(expiryDay("2026-11-19", null)).toBeNull();
  });

  it("says what a new token lacks", () => {
    expect(tokenProblems({ name: " ", scopes: [], expiresAt: null })).toEqual({
      name: "Give the token a name.",
      scopes: "Choose at least one scope.",
    });
    expect(
      tokenProblems({ name: "CI", scopes: ["a"], expiresAt: null }, [{ name: "ci" }]).name,
    ).toContain("already");
    expect(tokenProblems({ name: "CI", scopes: ["a"], expiresAt: null })).toEqual({});
    expect(visibleScopes(["a", "b", "c", "d"], 2)).toEqual({ shown: ["a", "b"], more: 2 });
  });
});

describe("secret, webhook, export and trash models", () => {
  it("counts down and checks a new secret", () => {
    expect(secondsLeft(1000, 3500)).toBe(3);
    expect(secondsLeft(5000, 3500)).toBe(0);
    expect(secretProblem("")).not.toBeNull();
    expect(secretProblem("a\nb")).not.toBeNull();
    expect(secretProblem("fg_test_xxxxxxxx")).toBeNull();
  });

  const d = (id: string, status: WebhookDelivery["status"]): WebhookDelivery => ({
    id,
    event: "invoice.paid",
    at: "2026-11-19 10:00",
    status,
    attempts: 1,
  });

  it("formats durations and filters deliveries", () => {
    expect(formatDeliveryDuration(84)).toBe("84 ms");
    expect(formatDeliveryDuration(1240)).toBe("1.2 s");
    expect(formatDeliveryDuration(30_000)).toBe("30 s");
    expect(formatDeliveryDuration(undefined)).toBe("—");
    const list = [d("1", "success"), d("2", "failed"), d("3", "retrying"), d("4", "pending")];
    expect(filterDeliveries(list, "failed").map((x) => x.id)).toEqual(["2", "3"]);
    expect(filterDeliveries(list, "all")).toHaveLength(4);
    expect(canRedeliver(d("4", "pending"))).toBe(false);
    expect(canRedeliver(d("2", "failed"))).toBe(true);
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

/* ---------------------------------------------------------------- NotificationPreferences */

describe("NotificationPreferences", () => {
  const props = { label: "Notifications", events, channels };
  const defaults: NotificationPrefs = {
    channels: { mention: ["email"] },
    digest: "daily",
    quiet: { enabled: false, from: "22:00", to: "07:00" },
  };

  it("toggles one cell and a group", async () => {
    const onChange = vi.fn<(v: NotificationPrefs) => void>();
    const root = await mount(h(NotificationPreferences, { ...props, onChange }));
    await click(byLabel(root, "Email: Someone mentions you"));
    expect(onChange.mock.lastCall![0].channels.mention).toEqual(["email"]);
    await click(root.querySelector(".fg-adm-np-grouprow input"));
    expect(onChange.mock.lastCall![0].channels).toMatchObject({
      mention: ["email"],
      assign: ["email"],
    });
    expect(byLabel(root, "Email: Assigned to you")).toHaveProperty("checked", true);
  });

  it("sets the digest and the quiet hours", async () => {
    const onChange = vi.fn<(v: NotificationPrefs) => void>();
    const root = await mount(h(NotificationPreferences, { ...props, onChange }));
    await click(byText(root, "[role=radio], button, label", "Daily"));
    expect(onChange.mock.lastCall![0].digest).toBe("daily");
    await click(
      root.querySelector<HTMLInputElement>("input[role=switch][type=checkbox]:not([aria-hidden])")!,
    );
    await click([...root.querySelectorAll<HTMLInputElement>("input[role=switch]")].at(-1)!);
    expect(onChange.mock.lastCall![0].quiet.enabled).toBe(true);
    expect(root.textContent).toContain("22:00 to 07:00, next day");
  });

  it("resets to the defaults, and only when it differs", async () => {
    const root = await mount(
      h(NotificationPreferences, { ...props, defaultValue: defaults, defaults }),
    );
    const reset = () => byText(root, "button", "Reset to default") as HTMLButtonElement;
    expect(reset().disabled).toBe(true);
    await click(byLabel(root, "Push: Assigned to you"));
    expect(reset().disabled).toBe(false);
    await click(reset());
    expect(byLabel(root, "Push: Assigned to you")).toHaveProperty("checked", false);
    expect(reset().disabled).toBe(true);
  });

  it("dims a channel that is not set up", () => {
    const out = html(
      h(NotificationPreferences, {
        ...props,
        channels: [{ id: "sms", label: "SMS", unavailable: true }],
      }),
    );
    expect(out).toContain("not set up");
    expect(out).toContain("disabled");
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

/* ---------------------------------------------------------------- TokenManager */

describe("TokenManager", () => {
  const scopes = [
    { id: "read", label: "Read", group: "Invoices", description: "List and open" },
    { id: "write", label: "Write", group: "Invoices" },
  ];
  const tokens: ApiToken[] = [
    {
      id: "t1",
      name: "CI deploy",
      scopes: ["read", "write", "x", "y"],
      createdAt: "2026-10-01",
      lastUsedAt: "2026-11-18",
      expiresAt: "2026-11-22",
      prefix: "fg_test_xxxx",
    },
    { id: "t2", name: "Old", scopes: ["read"], createdAt: "2026-01-01", expiresAt: "2026-11-01" },
  ];
  const base = { tokens, scopes, today: "2026-11-19", onCreate: () => {}, onRevoke: () => {} };

  it("lists tokens with scopes, last use and expiry", () => {
    const out = html(h(TokenManager, base));
    expect(out).toContain("CI deploy");
    expect(out).toContain("fg_test_xxxx…");
    expect(out).toContain("+1");
    expect(out).toContain("yesterday");
    expect(out).toContain("Never");
    expect(out).toContain("In 3 days");
    expect(out).toContain("Expired 18 days ago");
  });

  it("asks for a name and a scope, then creates", async () => {
    const onCreate = vi.fn<(arg?: unknown) => void>();
    const root = await mount(h(TokenManager, { ...base, onCreate }));
    await click(byText(root, "button", "Create token"));
    await click(q(".fg-dialog-foot .fg-btn-primary"));
    expect(onCreate).not.toHaveBeenCalled();
    expect(q("[role=dialog]")!.textContent).toContain("Give the token a name.");
    expect(q("[role=dialog]")!.textContent).toContain("Choose at least one scope.");
    await typeInto(
      q<HTMLInputElement>("[role=dialog] input[type=text], [role=dialog] input:not([type])")!,
      "Deploy",
    );
    await click(q("[role=dialog] .fg-adm-scope input"));
    await click(q("[role=dialog] .fg-dialog-foot .fg-btn-primary"));
    expect(onCreate).toHaveBeenCalledWith({
      name: "Deploy",
      scopes: ["read"],
      expiresAt: "2026-12-19",
    });
  });

  it("shows a created token once, with a warning to copy it now", async () => {
    const onCreatedClose = vi.fn<(arg?: unknown) => void>();
    const root = await mount(
      h(TokenManager, {
        ...base,
        created: { name: "Deploy", secret: "fg_test_xxxxxxxx" },
        onCreatedClose,
      }),
    );
    const dialog = q("[role=dialog]")!;
    expect(dialog.textContent).toContain("Copy your token now");
    expect(dialog.textContent).toContain("Shown once");
    expect(dialog.textContent).toContain("fg_test_xxxxxxxx");
    await click(byText(document, "button", "I have copied it"));
    expect(onCreatedClose).toHaveBeenCalled();
    expect(root).toBeTruthy();
  });

  it("revokes only after a confirmation", async () => {
    const onRevoke = vi.fn<(arg?: unknown) => void>();
    const root = await mount(h(TokenManager, { ...base, onRevoke }));
    await click(byLabel(root, "Revoke CI deploy"));
    expect(onRevoke).not.toHaveBeenCalled();
    expect(q("[role=alertdialog]")!.textContent).toContain("cannot be undone");
    await act(async () => new Promise((r) => setTimeout(r, 50)));
    expect(document.activeElement?.textContent).toBe("Cancel");
    await click(byText(document, "button", "Revoke token"));
    expect(onRevoke).toHaveBeenCalledWith("t1");
    expect(q("[role=dialog]")).toBeNull();
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

/* ---------------------------------------------------------------- EndpointList and DeliveryLog */

describe("EndpointList", () => {
  const endpoints: WebhookEndpoint[] = [
    {
      id: "e1",
      url: "https://example.test/hooks/a",
      name: "Billing sync",
      events: ["invoice.paid", "invoice.sent", "a", "b", "c", "d"],
      status: "failing",
      secret: { isSet: true, rotatedAt: "2026-11-01" },
    },
    { id: "e2", url: "https://example.test/hooks/b", events: [], status: "disabled" },
  ];

  it("lists endpoints with status, events and a hidden secret", () => {
    const out = html(h(EndpointList, { endpoints, getSecret: () => "fg_test_xxxxxxxx" }));
    expect(out).toContain("https://example.test/hooks/a");
    expect(out).toContain("Failing");
    expect(out).toContain("Disabled");
    expect(out).toContain("+2");
    expect(out).toContain("Signing secret");
    expect(out).not.toContain("fg_test_xxxxxxxx");
  });

  it("toggles, tests and shows how the test went", async () => {
    const onToggle = vi.fn<(arg?: unknown) => void>();
    const onTest = vi.fn<(arg?: unknown) => void>();
    const root = await mount(
      h(EndpointList, {
        endpoints,
        onToggle,
        onTest,
        testResults: { e1: { ok: false, code: 503 } },
        testing: ["e2"],
      }),
    );
    await click(byLabel(root, "Send a test event to https://example.test/hooks/a"));
    expect(onTest).toHaveBeenCalledWith("e1");
    expect(root.textContent).toContain("Test failed · 503");
    expect(
      (byLabel(root, "Send a test event to https://example.test/hooks/b") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    const switches = root.querySelectorAll<HTMLInputElement>("input[role=switch]");
    await click(switches[1]);
    expect(onToggle).toHaveBeenCalledWith("e2", true);
  });
});

describe("DeliveryLog", () => {
  const deliveries: WebhookDelivery[] = [
    {
      id: "d1",
      event: "invoice.paid",
      at: "2026-11-19 10:00",
      status: "success",
      code: 200,
      durationMs: 84,
      attempts: 1,
      request: { id: "evt_test_1" },
      response: { ok: true },
    },
    {
      id: "d2",
      event: "invoice.sent",
      at: "2026-11-19 09:00",
      status: "failed",
      code: 503,
      durationMs: 1240,
      attempts: 3,
      request: { id: "evt_test_2" },
    },
    { id: "d3", event: "invoice.sent", at: "2026-11-19 08:00", status: "pending", attempts: 0 },
  ];

  it("shows code, duration and attempts on a row", () => {
    const out = html(h(DeliveryLog, { deliveries }));
    expect(out).toContain("503");
    expect(out).toContain("1.2 s");
    expect(out).toContain("3 tries");
    expect(out).toContain("Delivered");
  });

  it("opens a row to show payload and answer as JSON", async () => {
    const root = await mount(h(DeliveryLog, { deliveries }));
    expect(root.textContent).not.toContain("evt_test_1");
    const toggle = root.querySelector<HTMLElement>(".fg-adm-delivery-toggle")!;
    await click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(root.textContent).toContain("evt_test_1");
    expect(root.textContent).toContain("Payload sent");
    await click(toggle);
    expect(root.textContent).not.toContain("evt_test_1");
  });

  it("filters to failures and redelivers", async () => {
    const onRedeliver = vi.fn<(arg?: unknown) => void>();
    const root = await mount(h(DeliveryLog, { deliveries, onRedeliver, redelivering: ["d1"] }));
    expect(root.querySelectorAll(".fg-adm-delivery")).toHaveLength(3);
    expect(root.querySelectorAll("button[aria-label^=Redeliver]")).toHaveLength(2);
    await click(byText(root, "button, label, [role=radio]", "Failed (1)"));
    expect(root.querySelectorAll(".fg-adm-delivery")).toHaveLength(1);
    await click(root.querySelector("button[aria-label^=Redeliver]"));
    expect(onRedeliver).toHaveBeenCalledWith("d2");
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
