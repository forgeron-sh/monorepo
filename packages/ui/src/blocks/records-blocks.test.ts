import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  filterFields,
  issueFields,
  projectFields,
  RecordBoard,
  RecordList,
  recordGroups,
  type IssueItem,
  type ProjectItem,
} from "../index";
import { matchesFilters } from "./filtering-model";

const issues: IssueItem[] = [
  { id: "A-1", title: "One", status: "todo", priority: 2, assignee: "hb", due: "2026-11-01" },
  { id: "A-2", title: "Two", status: "done", priority: 0 },
  { id: "A-3", title: "Three", status: "todo", priority: 1, labels: ["bug"] },
];
const people = [{ id: "hb", name: "Hugo Bernard" }];
const ctx = { people, today: "2026-11-17" };

describe("defineFields", () => {
  it("groups in the order of the choices, with names", () => {
    const groups = recordGroups(issueFields, issues, "status", ctx);
    expect(groups.map((g) => [g.key, g.records.length])).toEqual([
      ["todo", 2],
      ["done", 1],
    ]);
    expect(groups[0]!.name).toBe("Todo");
    const byPerson = recordGroups(issueFields, issues, "assignee", ctx);
    expect(byPerson.map((g) => g.name)).toEqual(["Hugo Bernard", "No assignee"]);
  });
  it("orders with the empty ones last", () => {
    const sorted = [...issues].sort(issueFields.compare("priority"));
    expect(sorted.map((i) => i.id)).toEqual(["A-3", "A-1", "A-2"]);
  });
  it("gives filter fields that matchesFilters reads", () => {
    const f = filterFields(issueFields, ctx, issues);
    expect(f.map((x) => x.id)).toContain("assignee");
    expect(f.find((x) => x.id === "assignee")!.options.at(-1)!.value).toBe("_");
    const filters = [{ field: "assignee", operator: "is" as const, values: ["_"] }];
    const spec = issueFields.viewSpec(ctx);
    expect(issues.filter((i) => matchesFilters(filters, (k) => spec.read(i, k))).length).toBe(2);
  });
  it("makes patches by kind", () => {
    expect(issueFields.patch("priority", "3", issues[0]!)).toEqual({ priority: 3 });
    expect(issueFields.patch("assignee", null, issues[0]!)).toEqual({ assignee: null });
    expect(issueFields.patch("due", null, issues[0]!)).toEqual({ due: undefined });
  });
});

describe("a second preset", () => {
  const projects: ProjectItem[] = [
    {
      id: "p1",
      name: "Closing",
      status: "started",
      health: "risk",
      lead: "hb",
      issues: 4,
      done: 1,
    },
    { id: "p2", name: "Portal", status: "planned", issues: 2, done: 0 },
  ];
  it("draws a list and a board of projects with no new block", () => {
    const groups = recordGroups(projectFields, projects, "status", ctx);
    const list = html(
      h(RecordList as never, { fields: projectFields, titleField: "name", context: ctx, groups }),
    );
    expect(list).toContain("Closing");
    expect(list).toContain("In Progress");
    expect(list).toContain("No lead");
    const board = html(
      h(RecordBoard as never, {
        fields: projectFields,
        titleField: "name",
        context: ctx,
        columns: recordGroups(projectFields, projects, "status", ctx, { keepEmpty: true }),
      }),
    );
    expect(board.match(/class="fg-iboard-col"/g)).toHaveLength(5);
  });
});
