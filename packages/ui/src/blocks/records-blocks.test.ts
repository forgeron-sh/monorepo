import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  defineFields,
  filterFields,
  issueFields,
  projectFields,
  RecordBoard,
  RecordFieldMark,
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

describe("the boolean, relation, file and json kinds", () => {
  interface Doc {
    id: string;
    ok?: boolean | null;
    owner?: string[];
    files?: string[];
    meta?: string | null;
  }
  const fields = defineFields<Doc>({
    ok: { label: "Signed", kind: "boolean", get: (r) => r.ok },
    owner: {
      label: "Owner",
      kind: "relation",
      get: (r) => r.owner,
      options: [
        { value: "c1", label: "Acme" },
        { value: "c2", label: "Bolt" },
      ],
    },
    files: { label: "Files", kind: "file", get: (r) => r.files },
    meta: { label: "Meta", kind: "json", get: (r) => r.meta },
  });
  const docs: Doc[] = [
    { id: "1", ok: true, owner: ["c1"], files: ["a.pdf"], meta: '{"a":1}' },
    { id: "2", ok: false, owner: ["c2", "c1"] },
    { id: "3" },
  ];

  it("has defaults for grouping, filtering and ordering", () => {
    expect(fields.groupable).toEqual(["ok"]);
    expect(fields.filterable).toEqual(["ok", "owner"]);
    expect(fields.sortable).toEqual(["ok", "owner"]);
  });
  it("treats false as a value and reads yes and no", () => {
    expect(fields.isEmpty(docs[1]!, "ok")).toBe(false);
    expect(fields.isEmpty(docs[2]!, "ok")).toBe(true);
    expect(fields.text(docs[0]!, "ok")).toBe("Yes");
    expect(fields.text(docs[1]!, "ok")).toBe("No");
    expect(fields.patch("ok", "true", docs[2]!)).toEqual({ ok: true });
    expect(fields.patch("ok", "false", docs[0]!)).toEqual({ ok: false });
    const groups = recordGroups(fields, docs, "ok");
    expect(groups.map((g) => [g.name, g.records.length])).toEqual([
      ["Yes", 1],
      ["No", 1],
      ["No signed", 1],
    ]);
    expect([...docs].sort(fields.compare("ok")).map((d) => d.id)).toEqual(["2", "1", "3"]);
  });
  it("names the records of a relation by their choices", () => {
    expect(fields.text(docs[1]!, "owner")).toBe("Bolt, Acme");
    expect(
      filterFields(fields)
        .find((f) => f.id === "owner")!
        .options.map((o) => o.label),
    ).toEqual(["Acme", "Bolt"]);
  });
  const mark = (record: Doc, name: string, view: "row" | "card" | "cell") =>
    html(h(RecordFieldMark as never, { fields, name, record, context: {}, view }));
  it("draws each kind in a row, a card and a cell", () => {
    for (const view of ["row", "card", "cell"] as const) {
      expect(mark(docs[0]!, "ok", view)).toContain("fg-rec-bool-on");
      expect(mark(docs[1]!, "ok", view)).not.toContain("fg-rec-bool-on");
      expect(mark(docs[1]!, "owner", view)).toContain("Bolt");
      expect(mark(docs[0]!, "files", view)).toContain("a.pdf");
    }
    expect(mark(docs[0]!, "meta", "row")).toContain("{&quot;a&quot;:1}");
    expect(mark(docs[0]!, "meta", "cell")).toContain("fg-rec-text");
  });
});
