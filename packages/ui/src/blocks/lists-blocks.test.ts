// @vitest-environment jsdom
import { Folder01Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  IssueBoard,
  IssueBoardAdd,
  IssueBoardCard,
  IssueBoardCards,
  IssueBoardColumn,
  IssueBoardColumnActions,
  IssueBoardColumnHeader,
  IssueBoardColumnToggle,
  IssueList,
  IssueListAdd,
  IssueListGroup,
  IssueListHeader,
  IssueListRow,
  IssueListRows,
  IssueListToggle,
  ProjectsTable,
  ProjectsTableBody,
  ProjectsTableCell,
  ProjectsTableHead,
  ProjectsTableHeader,
  ProjectsTableName,
  ProjectsTableRow,
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
    expect(out.match(/class="fg-board-col fg-iboard-col"/g)).toHaveLength(3);
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
  it("moves down and up inside a lane and stops at its ends", async () => {
    const root = await mount(h(IssueBoard, { columns: groups }));
    const first = root.querySelector<HTMLElement>('[data-issue="OPS-40"]')!;
    first.focus();
    await key(first, "ArrowUp");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-40");
    await key(document.activeElement!, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-41");
    await key(document.activeElement!, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-41");
    await key(document.activeElement!, "ArrowUp");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-40");
  });
  it("keeps the rank across lanes, skips an empty lane and stops at the last one", async () => {
    const root = await mount(h(IssueBoard, { columns: groups }));
    const second = root.querySelector<HTMLElement>('[data-issue="OPS-41"]')!;
    second.focus();
    await key(second, "ArrowRight");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-42");
    await key(document.activeElement!, "ArrowRight");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-42");
    await key(document.activeElement!, "ArrowLeft");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-40");
  });
  it("skips a folded lane with the arrows", async () => {
    const root = await mount(h(IssueBoard, { columns: groups, defaultCollapsed: ["todo"] }));
    const last = root.querySelector<HTMLElement>('[data-issue="OPS-41"]')!;
    last.focus();
    await key(last, "ArrowRight");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-41");
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
    expect(out).toContain("<table");
    expect(out).toContain('scope="col"');
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

describe("IssueList parts", () => {
  const composed = (props: Record<string, unknown> = {}) =>
    h(
      IssueList,
      { groups, labels, people, today: "2026-11-17", onAdd: () => {}, ...props },
      groups.map((group) =>
        h(
          IssueListGroup,
          { key: group.key, group, className: "mine" },
          h(IssueListHeader, null, h(IssueListToggle), h(IssueListAdd)),
          h(
            IssueListRows,
            null,
            group.issues.map((issue) => h(IssueListRow, { key: issue.id, record: issue })),
          ),
        ),
      ),
    );
  it("draws what the shorthand draws, with a data-slot and the class on every part", () => {
    const parts = html(composed());
    expect(parts).toContain('data-slot="record-list"');
    expect(parts).toContain('data-slot="record-list-group"');
    expect(parts).toContain('data-slot="record-list-header"');
    expect(parts).toContain('data-slot="record-list-toggle"');
    expect(parts).toContain('data-slot="record-list-rows"');
    expect(parts).toContain('data-slot="record-list-row"');
    expect(parts).toContain('class="fg-ilist-group mine"');
    expect(parts).toContain('data-issue="OPS-42"');
    expect(parts).toContain("Urgent priority");
    // the same rows as the shorthand (it also draws the empty group's header: hidden here by the caller)
    const short = html(
      h(IssueList, { groups, labels, people, today: "2026-11-17", onAdd: () => {} }),
    );
    expect(parts.match(/data-issue=/g)).toEqual(short.match(/data-issue=/g));
  });
  it("takes the attributes of its root", () => {
    const out = html(h(IssueList, { groups, id: "mine", "aria-describedby": "x" } as never));
    expect(out).toContain('id="mine"');
    expect(out).toContain('aria-describedby="x"');
  });
  it("folds a group and adds to it from the parts", async () => {
    const onAdd = vi.fn<(key: string) => void>();
    const root = await mount(composed({ onAdd }));
    const toggle = root.querySelector<HTMLButtonElement>(".fg-ilist-toggle")!;
    await act(async () => toggle.click());
    expect(root.querySelector('[data-issue="OPS-40"]')).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await act(async () =>
      root.querySelector<HTMLButtonElement>('[aria-label="New issue in Todo"]')!.click(),
    );
    expect(onAdd).toHaveBeenCalledWith("todo");
  });
  it("keeps the arrows and the selection", async () => {
    const onSelectedChange = vi.fn<(id: string) => void>();
    const root = await mount(composed({ onSelectedChange }));
    const first = root.querySelector<HTMLElement>('[data-issue="OPS-40"]')!;
    first.focus();
    await key(first, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-41");
    expect(onSelectedChange).toHaveBeenLastCalledWith("OPS-41");
  });
  it("lets a row be your own element", () => {
    const out = html(
      h(
        IssueList,
        { groups: [groups[0]!] },
        h(
          IssueListGroup,
          { group: groups[0]! },
          h(
            IssueListRows,
            null,
            h(
              IssueListRow,
              { record: groups[0]!.issues[0]!, asChild: true },
              h("li", { className: "mine" }, "custom"),
            ),
          ),
        ),
      ),
    );
    expect(out).toContain('data-slot="record-list-row"');
    expect(out).toContain('class="mine"');
    expect(out).toContain(">custom</li>");
    expect(out).not.toMatch(/class="fg-ilist-row[ "]/);
  });
  it("refuses a part outside its list", () => {
    expect(() => html(h(IssueListToggle))).toThrow(/RecordList/);
  });
});

describe("IssueBoard parts", () => {
  const composed = (props: Record<string, unknown> = {}) =>
    h(
      IssueBoard,
      { columns: groups, labels, people, today: "2026-11-17", onAdd: () => {}, ...props },
      groups.map((column) =>
        h(
          IssueBoardColumn,
          { key: column.key, column, className: "mine" },
          h(IssueBoardColumnHeader, null, h(IssueBoardColumnToggle), h(IssueBoardColumnActions)),
          h(
            IssueBoardCards,
            null,
            column.issues.map((issue) => h(IssueBoardCard, { key: issue.id, record: issue })),
            h(IssueBoardAdd),
          ),
        ),
      ),
    );
  it("draws a column per group from the parts, an IssueGroup as the column", () => {
    const out = html(composed());
    expect(out).toContain('data-slot="record-board"');
    expect(out.match(/data-slot="record-board-column"/g)).toHaveLength(3);
    expect(out.match(/data-slot="record-board-card"/g)).toHaveLength(3);
    expect(out).toContain('data-slot="record-board-column-toggle"');
    expect(out).toContain('data-slot="record-board-add"');
    expect(out).toContain("fg-iboard-col mine");
    expect(out).toContain("Due Nov 12");
  });
  it("folds a column to a strip from its toggle and adds from its lane", async () => {
    const onAdd = vi.fn<(key: string) => void>();
    const root = await mount(composed({ onAdd }));
    const toggle = root.querySelector<HTMLButtonElement>(".fg-iboard-toggle")!;
    await act(async () => toggle.click());
    expect(root.querySelector('[data-issue="OPS-40"]')).toBeNull();
    expect(root.querySelector(".fg-iboard-folded")).not.toBeNull();
    await act(async () => root.querySelector<HTMLButtonElement>(".fg-iboard-add")!.click());
    expect(onAdd).toHaveBeenCalled();
  });
  it("keeps the arrows between lanes", async () => {
    const root = await mount(composed());
    const first = root.querySelector<HTMLElement>('[data-issue="OPS-41"]')!;
    first.focus();
    await key(first, "ArrowRight");
    expect(document.activeElement?.getAttribute("data-issue")).toBe("OPS-42");
  });
  it("refuses a part outside its board", () => {
    expect(() => html(h(IssueBoardColumnToggle))).toThrow(/RecordBoard/);
  });
});

describe("ProjectsTable parts", () => {
  const composed = (props: Record<string, unknown> = {}) =>
    h(
      ProjectsTable,
      { projects, people, today: "2026-11-17", sortable: true, ...props },
      h(
        ProjectsTableHeader,
        null,
        h(ProjectsTableHead, { column: "name" }),
        h(ProjectsTableHead, { column: "status" }),
        h(ProjectsTableHead, { column: "progress" }),
      ),
      h(
        ProjectsTableBody,
        null,
        projects.map((project) =>
          h(
            ProjectsTableRow,
            { key: project.id, project, className: "mine" },
            h(ProjectsTableName, { project }),
            h(ProjectsTableCell, { project, column: "status" }),
            h(ProjectsTableCell, { project, column: "progress" }),
          ),
        ),
      ),
    );
  it("draws only the columns the parts name, on the Table parts", () => {
    const out = html(composed());
    expect(out).toContain('data-slot="projects-table"');
    expect(out).toContain('data-slot="projects-table-header"');
    expect(out.match(/data-slot="projects-table-head"/g)).toHaveLength(3);
    expect(out.match(/data-slot="projects-table-row"/g)).toHaveLength(2);
    expect(out).toContain('class="fg-table-row fg-ptable-row mine"');
    expect(out).toContain('data-column="progress"');
    expect(out).not.toContain('data-column="lead"');
    expect(out).toContain("Lyon depot");
  });
  it("sorts from a head part, rows in the new order", async () => {
    const root = await mount(
      h(
        ProjectsTable,
        { projects, sortable: true },
        h(
          ProjectsTableHeader,
          null,
          h(ProjectsTableHead, { column: "name" }),
          h(ProjectsTableHead, { column: "progress" }),
        ),
        h(ProjectsTableBody),
      ),
    );
    const names = () => [...root.querySelectorAll(".fg-ptable-title")].map((n) => n.textContent);
    const progress = [...root.querySelectorAll<HTMLButtonElement>(".fg-ptable-sort")].find(
      (b) => b.textContent === "Progress",
    )!;
    expect(progress).toBeDefined();
    await act(async () => progress.click());
    expect(names()).toEqual(["Year-end closing", "Lyon depot"]);
  });
  it("moves between rows with the arrows and opens with Enter", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const root = await mount(h(ProjectsTable, { projects, onOpen }));
    const first = root.querySelector<HTMLElement>('tr[data-project="lyon"]')!;
    expect(first.getAttribute("tabindex")).toBe("0");
    first.focus();
    await key(first, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-project")).toBe("q4");
    await key(document.activeElement!, "Enter");
    expect(onOpen).toHaveBeenCalledWith("q4");
  });
  it("leaves the keys of a control inside a row to the control", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const root = await mount(h(ProjectsTable, { projects, onOpen }));
    const name = root.querySelector<HTMLButtonElement>(".fg-ptable-open")!;
    name.focus();
    await key(name, "ArrowDown");
    expect(document.activeElement).toBe(name);
    expect(onOpen).not.toHaveBeenCalled();
  });
  it("refuses a part outside its table", () => {
    expect(() => html(h(ProjectsTableHead, { column: "name" }))).toThrow(/ProjectsTable/);
  });
});
