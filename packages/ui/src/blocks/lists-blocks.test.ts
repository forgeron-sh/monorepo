// @vitest-environment jsdom
import { Folder01Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  IssueBoard,
  IssueList,
  ProjectsTable,
  type IssueGroup,
  type IssueItem,
  type ProjectItem,
  type ProjectSort,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let reactRoot: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => reactRoot?.unmount());
  reactRoot = undefined;
  host?.remove();
  host = undefined;
  document.body.innerHTML = "";
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  reactRoot = createRoot(host);
  await act(async () => reactRoot!.render(element));
  return host;
};
const settle = () => act(async () => new Promise((r) => setTimeout(r, 30)));
/** A pointer press then a click, as a mouse does: what Base UI's triggers listen to. */
const press = async (el: Element) => {
  await act(async () => {
    const init = { bubbles: true, button: 0 };
    el.dispatchEvent(new PointerEvent("pointerdown", { ...init, pointerType: "mouse" }));
    el.dispatchEvent(new MouseEvent("mousedown", init));
    el.dispatchEvent(new PointerEvent("pointerup", { ...init, pointerType: "mouse" }));
    el.dispatchEvent(new MouseEvent("mouseup", init));
    (el as HTMLElement).click();
  });
  await settle();
};
/** The combobox of a picker, found by the name its label gives it. */
const picker = (scope: ParentNode, name: string) =>
  [...scope.querySelectorAll<HTMLElement>("[role=combobox]")].find(
    (b) => document.getElementById(b.getAttribute("aria-labelledby") ?? "")?.textContent === name,
  );
/** Clicks the row of an open list whose label reads `text`. */
const choose = async (role: string, text: string) => {
  const selector = role.includes(" ") ? role.replace(/^(\w+)/, "[role=$1]") : `[role=${role}]`;
  const item = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (o) => (o.querySelector(".fg-pop-label") ?? o).textContent?.trim() === text,
  );
  expect(item, `${role} ${text}`).toBeDefined();
  await act(async () => item!.click());
  await settle();
};
const key = async (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

const labels = [{ value: "bug", label: "Bug", color: "var(--danger)" }];
const people = [{ id: "hb", name: "Hugo Bernard" }];
const groups: IssueGroup[] = [
  {
    key: "progress",
    name: "In Progress",
    status: "progress",
    issues: [
      {
        id: "OPS-40",
        title: "Supplier invoices arrive twice from Odoo",
        status: "progress",
        priority: 1,
        labels: ["bug"],
        due: "2026-11-12",
        assignee: "hb",
      },
      { id: "OPS-41", title: "Fire exit signage audit", status: "progress" },
    ],
  },
  { key: "review", name: "In Review", status: "review", issues: [] },
  {
    key: "todo",
    name: "Todo",
    status: "todo",
    issues: [{ id: "OPS-42", title: "Carrier rates: import the new grid", status: "todo" }],
  },
];

describe("IssueList", () => {
  it("draws groups and rows, hides empty groups, says what the marks draw", () => {
    const out = html(h(IssueList, { groups, labels, people, today: "2026-11-17" }));
    expect(out).toContain("In Progress");
    expect(out).not.toContain("In Review");
    expect(out).toContain('data-issue="OPS-40"');
    expect(out).toContain("Urgent priority");
    expect(out).toContain("Hugo Bernard");
    expect(out).toContain("No assignee");
    expect(out).toMatch(/fg-issue-overdue[^>]*>Nov 12/);
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
  });
  it("shows empty groups on demand and drops hidden properties", () => {
    const out = html(h(IssueList, { groups, showEmptyGroups: true, properties: ["id"] }));
    expect(out).toContain("In Review");
    expect(out).not.toContain("fg-ilist-due");
    expect(out).not.toContain("fg-issue-who");
  });
  it("writes the counts only on demand", () => {
    expect(html(h(IssueList, { groups }))).not.toContain("fg-ilist-count");
    expect(html(h(IssueList, { groups, showCounts: true }))).toContain("fg-ilist-count");
  });
  it("says so when there is nothing", () => {
    const out = html(h(IssueList, { groups: [{ key: "x", name: "X", issues: [] }] }));
    expect(out).toContain("No issues here yet");
  });
  it("moves with the arrows across groups and opens with a click", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const onSelectedChange = vi.fn<(id: string) => void>();
    const root = await mount(h(IssueList, { groups, onOpen, onSelectedChange }));
    const first = root.querySelector<HTMLButtonElement>('[data-issue="OPS-40"]')!;
    first.focus();
    await key(first, "ArrowDown");
    await key(document.activeElement!, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-42");
    expect(onSelectedChange).toHaveBeenLastCalledWith("OPS-42");
    expect(document.activeElement?.getAttribute("aria-current")).toBe("true");
    await key(document.activeElement!, "Home");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-40");
    await act(async () => (document.activeElement as HTMLElement).click());
    expect(onOpen).toHaveBeenCalledWith("OPS-40");
  });
  it("folds a group", async () => {
    const onCollapsedChange = vi.fn<(keys: string[]) => void>();
    const root = await mount(h(IssueList, { groups, onCollapsedChange }));
    const toggle = root.querySelector<HTMLButtonElement>(".fg-ilist-toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await act(async () => toggle.click());
    expect(onCollapsedChange).toHaveBeenCalledWith(["progress"]);
    expect(root.querySelector('[data-issue="OPS-40"]')).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
  it("adds to a group", async () => {
    const onAdd = vi.fn<(key: string) => void>();
    const root = await mount(h(IssueList, { groups, onAdd }));
    await act(async () =>
      root.querySelector<HTMLButtonElement>('[aria-label="New issue in Todo"]')!.click(),
    );
    expect(onAdd).toHaveBeenCalledWith("todo");
  });
});

describe("IssueBoard", () => {
  it("draws a column per group, a card per issue", () => {
    const out = html(h(IssueBoard, { columns: groups, labels, people, today: "2026-11-17" }));
    expect(out.match(/class="fg-iboard-col"/g)).toHaveLength(3);
    expect(out).toContain("Due Nov 12");
    expect(out).toContain("Bug");
    expect(out).not.toContain("fg-iboard-count");
    expect(html(h(IssueBoard, { columns: groups, showCounts: true }))).toContain("fg-iboard-count");
  });
  it("moves between lanes with the arrows", async () => {
    const root = await mount(h(IssueBoard, { columns: groups }));
    const first = root.querySelector<HTMLButtonElement>('[data-issue="OPS-41"]')!;
    first.focus();
    await key(first, "ArrowRight");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-42");
    await key(document.activeElement!, "ArrowLeft");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-40");
  });
  it("folds a column to a strip", async () => {
    const root = await mount(h(IssueBoard, { columns: groups, defaultCollapsed: ["todo"] }));
    expect(root.querySelector(".fg-iboard-folded")?.textContent).toContain("Todo");
    expect(root.querySelector('[data-issue="OPS-42"]')).toBeNull();
  });
});

const twoLabels = [...labels, { value: "ops", label: "Warehouse", color: "var(--warning)" }];
const editable = (more: Record<string, unknown> = {}) => {
  const onIssueChange = vi.fn<(id: string, patch: Partial<IssueItem>) => void>();
  const onOpen = vi.fn<(id: string) => void>();
  const props = {
    groups,
    labels: twoLabels,
    people,
    today: "2026-11-17",
    onIssueChange,
    onOpen,
    ...more,
  };
  return { onIssueChange, onOpen, props };
};

describe("IssueList, editing in place", () => {
  it("stays read-only without onIssueChange", () => {
    const out = html(h(IssueList, { groups, labels, people }));
    expect(out).not.toContain('role="combobox"');
    expect(out).toMatch(/<button[^>]*class="fg-ilist-row/);
  });
  it("picks a priority, a status, an assignee from the row's marks without opening it", async () => {
    const { onIssueChange, onOpen, props } = editable();
    const root = await mount(h(IssueList, props));
    const row = root.querySelector('[data-issue="OPS-40"]')!;
    await press(picker(row, "Priority")!);
    await choose("option", "Low");
    expect(onIssueChange).toHaveBeenLastCalledWith("OPS-40", { priority: 4 });
    await press(picker(row, "Status")!);
    await choose("option", "Done");
    expect(onIssueChange).toHaveBeenLastCalledWith("OPS-40", { status: "done" });
    await press(picker(row, "Assignee")!);
    await choose("option", "No assignee");
    expect(onIssueChange).toHaveBeenLastCalledWith("OPS-40", { assignee: null });
    expect(onOpen).not.toHaveBeenCalled();
  });
  it("adds a label and sets a due date", async () => {
    const { onIssueChange, onOpen, props } = editable();
    const root = await mount(h(IssueList, props));
    const row = root.querySelector('[data-issue="OPS-40"]')!;
    await press(picker(row, "Labels")!);
    await choose("option", "Warehouse");
    expect(onIssueChange).toHaveBeenLastCalledWith("OPS-40", { labels: ["bug", "ops"] });
    await press(row.querySelector('[aria-label^="Due date"]')!);
    await choose("dialog button", "Tomorrow");
    expect(onIssueChange).toHaveBeenLastCalledWith("OPS-40", { due: "2026-11-18" });
    expect(onOpen).not.toHaveBeenCalled();
  });
  it("opens a picker on the current row from its key", async () => {
    const { onIssueChange, props } = editable({ defaultSelected: "OPS-40" });
    const root = await mount(h(IssueList, props));
    const row = root.querySelector<HTMLElement>('[data-issue="OPS-40"]')!;
    await act(async () => row.focus());
    await key(row, "s");
    await settle();
    expect(document.querySelector("[role=listbox]")).not.toBeNull();
    await choose("option", "In Review");
    expect(onIssueChange).toHaveBeenLastCalledWith("OPS-40", { status: "review" });
  });
  it("draws no trigger for a read-only property, and a custom editor in place", async () => {
    const { onIssueChange, onOpen, props } = editable({
      editors: {
        status: false,
        due: {
          render: (_issue: IssueItem, change: (patch: Partial<IssueItem>) => void) =>
            h("button", { type: "button", onClick: () => change({ due: undefined }) }, "Clear"),
        },
      },
    });
    const root = await mount(h(IssueList, props));
    const row = root.querySelector('[data-issue="OPS-40"]')!;
    expect(picker(row, "Status")).toBeUndefined();
    expect(row.textContent).toContain("In Progress");
    expect(picker(row, "Priority")).toBeDefined();
    await act(async () => row.querySelector<HTMLButtonElement>(".fg-issue-custom button")!.click());
    expect(onIssueChange).toHaveBeenCalledWith("OPS-40", { due: undefined });
    expect(onOpen).not.toHaveBeenCalled();
  });
  it("restricts the choices", async () => {
    const { props } = editable({ editors: { status: { statuses: ["todo", "done"] } } });
    const root = await mount(h(IssueList, props));
    await press(picker(root.querySelector('[data-issue="OPS-40"]')!, "Status")!);
    const names = [...document.querySelectorAll("[role=option]")].map((o) => o.textContent);
    expect(names).toEqual(["Todo1", "Done2"]);
  });
  it("still opens the row on a click or Enter on the row itself", async () => {
    const { onOpen, props } = editable();
    const root = await mount(h(IssueList, props));
    const row = root.querySelector<HTMLElement>('[data-issue="OPS-41"]')!;
    await act(async () => row.click());
    expect(onOpen).toHaveBeenLastCalledWith("OPS-41");
    row.focus();
    await key(row, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-42");
    await key(document.activeElement!, "Enter");
    expect(onOpen).toHaveBeenLastCalledWith("OPS-42");
  });
  it("shows the author on demand", () => {
    const out = html(
      h(IssueList, {
        groups: [{ key: "a", name: "A", issues: [{ ...groups[0]!.issues[0]!, author: "hb" }] }],
        people,
        properties: ["author"],
      }),
    );
    expect(out).toContain("Created by Hugo Bernard");
    expect(html(h(IssueList, { groups, people }))).not.toContain("Created by");
  });
  it("opens the row menu on a right click and on Shift+F10", async () => {
    const onRowAction = vi.fn<(id: string, action: string) => void>();
    const rowMenu = () => [{ id: "copy", label: "Copy ID" }];
    const root = await mount(h(IssueList, { groups, rowMenu, onRowAction }));
    const row = root.querySelector<HTMLElement>('[data-issue="OPS-41"]')!;
    await act(async () => {
      row.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 5, clientY: 5 }));
    });
    await settle();
    await choose("menuitem", "Copy ID");
    expect(onRowAction).toHaveBeenCalledWith("OPS-41", "copy");
    row.focus();
    await act(async () => {
      row.dispatchEvent(
        new KeyboardEvent("keydown", { key: "F10", shiftKey: true, bubbles: true }),
      );
    });
    await settle();
    expect(document.querySelector("[role=menu]")).not.toBeNull();
  });
});

describe("IssueBoard, editing in place", () => {
  it("edits from a card and opens an empty property from its key", async () => {
    const onIssueChange = vi.fn<(id: string, patch: Partial<IssueItem>) => void>();
    const onOpen = vi.fn<(id: string) => void>();
    const root = await mount(
      h(IssueBoard, {
        columns: groups,
        people,
        labels,
        today: "2026-11-17",
        defaultSelected: "OPS-41",
        onIssueChange,
        onOpen,
      }),
    );
    const card = root.querySelector<HTMLElement>('[data-issue="OPS-40"]')!;
    await press(picker(card, "Assignee")!);
    await choose("option", "No assignee");
    expect(onIssueChange).toHaveBeenLastCalledWith("OPS-40", { assignee: null });
    const empty = root.querySelector<HTMLElement>('[data-issue="OPS-41"]')!;
    await act(async () => empty.focus());
    await key(empty, "p");
    await settle();
    await choose("option", "High");
    expect(onIssueChange).toHaveBeenLastCalledWith("OPS-41", { priority: 2 });
    expect(onOpen).not.toHaveBeenCalled();
  });
});

const projects: ProjectItem[] = [
  {
    id: "lyon",
    name: "Lyon depot",
    icon: Folder01Icon,
    status: "started",
    health: "risk",
    lead: "hb",
    target: "2026-12-15",
    issues: 10,
    done: 4,
    started: 3,
  },
  {
    id: "q4",
    name: "Year-end closing",
    color: "var(--success)",
    status: "planned",
    target: "2027-01-31",
    issues: 4,
    done: 0,
  },
];

describe("ProjectsTable", () => {
  it("draws the columns, the progress, the lead", () => {
    const out = html(h(ProjectsTable, { projects, people, today: "2026-11-17" }));
    expect(out).toContain('role="table"');
    expect(out).toContain("At risk");
    expect(out).toContain("No updates");
    expect(out).toContain('aria-valuenow="40"');
    expect(out.match(/fg-ptable-on/g)).toHaveLength(8);
    expect(out.match(/fg-ptable-mid/g)).toHaveLength(6);
    expect(out).toContain("Hugo");
    expect(out).toContain("Jan 31, 2027");
  });
  it("hides health when no project has one", () => {
    const out = html(h(ProjectsTable, { projects: [projects[1]!] }));
    expect(out).not.toContain("Health");
  });
  it("sorts by a header, then the other way", async () => {
    const onSortChange = vi.fn<(sort: ProjectSort) => void>();
    const root = await mount(h(ProjectsTable, { projects, sortable: true, onSortChange }));
    const names = () => [...root.querySelectorAll(".fg-ptable-title")].map((n) => n.textContent);
    const progress = [...root.querySelectorAll<HTMLButtonElement>(".fg-ptable-sort")].find(
      (b) => b.textContent === "Progress",
    )!;
    await act(async () => progress.click());
    expect(names()).toEqual(["Year-end closing", "Lyon depot"]);
    expect(progress.parentElement?.getAttribute("aria-sort")).toBe("ascending");
    await act(async () => progress.click());
    expect(names()).toEqual(["Lyon depot", "Year-end closing"]);
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "progress", direction: "desc" });
  });
  it("opens a row through its name", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const root = await mount(h(ProjectsTable, { projects, onOpen }));
    await act(async () => root.querySelector<HTMLButtonElement>(".fg-ptable-open")!.click());
    expect(onOpen).toHaveBeenCalledWith("lyon");
  });
  it("edits status, health, lead and target in place, without opening the row", async () => {
    const onProjectChange = vi.fn<(id: string, patch: Partial<ProjectItem>) => void>();
    const onOpen = vi.fn<(id: string) => void>();
    const root = await mount(
      h(ProjectsTable, { projects, people, today: "2026-11-17", onProjectChange, onOpen }),
    );
    const row = root.querySelector('[data-project="lyon"]')!;
    await press(picker(row, "Status")!);
    await choose("option", "Paused");
    expect(onProjectChange).toHaveBeenLastCalledWith("lyon", { status: "paused" });
    await press(picker(row, "Health")!);
    await choose("option", "On track");
    expect(onProjectChange).toHaveBeenLastCalledWith("lyon", { health: "track" });
    await press(picker(row, "Lead")!);
    await choose("option", "No lead");
    expect(onProjectChange).toHaveBeenLastCalledWith("lyon", { lead: null });
    await press(row.querySelector('[aria-label^="Target date"]')!);
    await choose("dialog button", "Remove target date");
    expect(onProjectChange).toHaveBeenLastCalledWith("lyon", { target: undefined });
    expect(onOpen).not.toHaveBeenCalled();
  });
  it("keeps a field read-only on demand", () => {
    const out = html(
      h(ProjectsTable, { projects, people, onProjectChange: () => {}, editors: { lead: false } }),
    );
    expect(out).toContain(`class="fg-sr">Status<`);
    expect(out).not.toContain(`class="fg-sr">Lead<`);
  });
  it("details the progress on demand", async () => {
    const root = await mount(h(ProjectsTable, { projects, columns: ["progress"] }));
    await press(root.querySelector(".fg-ptable-progress")!);
    const detail = document.querySelector(".fg-ptable-detail")!;
    expect(detail.textContent).toContain("Done440%");
    expect(detail.textContent).toContain("Started330%");
    expect(detail.textContent).toContain("Not started330%");
  });
  it("adds a ⋯ column and a right-click menu", async () => {
    const onRowAction = vi.fn<(id: string, action: string) => void>();
    const root = await mount(
      h(ProjectsTable, {
        projects,
        rowMenu: () => [{ id: "archive", label: "Archive" }],
        onRowAction,
      }),
    );
    await press(root.querySelector('[aria-label="Actions on Year-end closing"]')!);
    await choose("menuitem", "Archive");
    expect(onRowAction).toHaveBeenCalledWith("q4", "archive");
  });
});
