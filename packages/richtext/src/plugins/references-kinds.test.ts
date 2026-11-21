import { describe, expect, it } from "vitest";
import {
  PluginError,
  definePlugin,
  diffReferences,
  doc,
  fromMarkdown,
  normalizeDoc,
  paragraph,
  referencesOf,
  toHtml,
  toMarkdown,
  toPlainText,
  type CorePlugin,
  type RichNode,
} from "../index";
import { createRegistry } from "../core/plugin";
import { dates, datesPlugin } from "./dates";
import { fullCorePlugins } from "./index";
import { pages, pagesPlugin } from "./pages";
import { tags, tagsPlugin } from "./tags";
import {
  addDaysTo,
  dateId,
  dateShortcut,
  defaultDateLabel,
  isDateString,
  isPastDate,
  isTimeString,
  parseDateId,
} from "./dates";

const ref = (kind: string, id: string, label: string): RichNode => ({
  type: "reference",
  attrs: { kind, id, label },
});

const list: ReadonlyArray<CorePlugin> = [
  ...fullCorePlugins,
  pagesPlugin({ href: (r) => `/pages/${r.id}` }),
  tagsPlugin(),
  datesPlugin({ isPast: (p) => p.date < "2026-11-20" }),
];

const sample = doc(
  paragraph(
    "See ",
    ref("page", "p_1", "Launch plan"),
    " ",
    ref("tag", "t_1", "urgent"),
    " due ",
    ref("date", "2026-11-20", "2026-11-20"),
    " at ",
    ref("date", "2026-11-21T14:30", "2026-11-21 14:30"),
    " cc ",
    ref("user", "u_1", "Ada"),
  ),
);

describe("Markdown", () => {
  it("writes each kind with the generic convention [Label](ref:kind:id)", () => {
    const md = toMarkdown(sample, list);
    expect(md).toContain("[Launch plan](ref:page:p_1)");
    expect(md).toContain("[urgent](ref:tag:t_1)");
    expect(md).toContain("[2026-11-20](ref:date:2026-11-20)");
    expect(md).toContain("[2026-11-21 14:30](ref:date:2026-11-21T14:30)");
    expect(md).toContain("[@Ada](mention:u_1)");
  });

  it("reads it back to the same document", () => {
    const back = fromMarkdown(toMarkdown(sample, list), list);
    expect(back).toEqual(normalizeDoc(sample, list));
    expect(referencesOf(back).map((r) => `${r.kind}:${r.id}`)).toEqual([
      "page:p_1",
      "tag:t_1",
      "date:2026-11-20",
      "date:2026-11-21T14:30",
      "user:u_1",
    ]);
  });

  it("keeps labels with brackets and a date-like id intact", () => {
    const tricky = doc(paragraph(ref("page", "a:b", "Q&A [draft] (v2)"), ref("tag", "x", "a]b")));
    expect(fromMarkdown(toMarkdown(tricky, list), list)).toEqual(normalizeDoc(tricky, list));
  });

  it("reads a reference of a kind no plugin of the list handles as the generic one", () => {
    const back = fromMarkdown("[Odd](ref:widget:w1)", [...fullCorePlugins]);
    expect(referencesOf(back)).toEqual([{ kind: "widget", id: "w1", label: "Odd" }]);
  });
});

describe("plain text", () => {
  it("writes a page as its label, a tag with its #, a date as its label", () => {
    expect(toPlainText(sample, {}, list)).toBe(
      "See Launch plan #urgent due 2026-11-20 at 2026-11-21 14:30 cc @Ada",
    );
  });

  it("is the generic text without the plugins", () => {
    expect(toPlainText(doc(paragraph(ref("tag", "t", "x"))), {}, fullCorePlugins)).toBe("x");
  });
});

describe("static view", () => {
  const html = toHtml(sample, list);

  it("links a page when the app gives an address, a chip otherwise", () => {
    expect(html).toContain(
      '<a class="fg-rt-mention fg-rt-page" href="/pages/p_1" data-reference="p_1" data-reference-kind="page">Launch plan</a>',
    );
    const bare = toHtml(doc(paragraph(ref("page", "p_1", "Plan"))), [...fullCorePlugins, pages]);
    expect(bare).not.toContain("<a");
    expect(bare).toContain('data-reference-kind="page"');
  });

  it("drops an address that could run code", () => {
    const evil = [...fullCorePlugins, pagesPlugin({ href: () => "javascript:alert(1)" })];
    const out = toHtml(doc(paragraph(ref("page", "p", "Plan"))), evil);
    expect(out).not.toContain("javascript");
    expect(out).not.toContain("<a");
  });

  it("shows a tag with its #", () => {
    expect(html).toContain('<span class="fg-rt-mention fg-rt-tag"');
    expect(html).toContain(">#urgent</span>");
    const linked = toHtml(doc(paragraph(ref("tag", "t", "x"))), [
      ...fullCorePlugins,
      tagsPlugin({ href: (r) => `/tags/${r.id}` }),
    ]);
    expect(linked).toContain('<a class="fg-rt-mention fg-rt-tag" href="/tags/t"');
  });

  it("shows a date as a <time>, overdue when the app says so", () => {
    expect(html).toContain(
      '<time class="fg-rt-mention fg-rt-date" datetime="2026-11-21T14:30" data-reference="2026-11-21T14:30"',
    );
    const past = toHtml(doc(paragraph(ref("date", "2026-01-02", "Jan 2"))), list);
    expect(past).toContain('class="fg-rt-mention fg-rt-date fg-rt-past"');
    const plain = toHtml(doc(paragraph(ref("date", "2026-01-02", "Jan 2"))), [
      ...fullCorePlugins,
      dates,
    ]);
    expect(plain).not.toContain("fg-rt-past");
  });

  it("falls back to the generic chip for a date id that is not a date", () => {
    const out = toHtml(doc(paragraph(ref("date", "2026-02-31", "Feb 31"))), list);
    expect(out).not.toContain("<time");
    expect(out).toContain("Feb 31");
  });

  it("escapes labels", () => {
    const out = toHtml(doc(paragraph(ref("tag", "t", "<b>x</b>"), ref("page", "p", "<i>"))), list);
    expect(out).not.toContain("<b>");
    expect(out).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("leaves the user kind and the unknown kinds to the references plugin", () => {
    expect(html).toContain('class="fg-rt-mention" data-reference="u_1"');
    const odd = toHtml(doc(paragraph(ref("widget", "w", "W"))), list);
    expect(odd).toContain('data-reference-kind="widget"');
  });
});

describe("the plugin contract", () => {
  it("needs the references plugin", () => {
    expect(() => createRegistry([pages])).toThrow(PluginError);
    expect(() => createRegistry([...fullCorePlugins, pages, tags, dates])).not.toThrow();
  });

  it("refuses to decorate a node no earlier plugin owns", () => {
    const stray = definePlugin({
      id: "stray",
      name: "Stray",
      description: "x",
      decorate: { nothing: { text: () => "" } },
    });
    expect(() => createRegistry([stray])).toThrow(/decorates node type "nothing"/);
  });

  it("layers decorations in plugin order", () => {
    const shout = definePlugin({
      id: "shout",
      name: "Shout",
      description: "x",
      requires: ["references"],
      decorate: { reference: { text: (_n, _w, next) => next().toUpperCase() } },
    });
    const text = toPlainText(doc(paragraph(ref("tag", "t", "x"))), {}, [
      ...fullCorePlugins,
      tags,
      shout,
    ]);
    expect(text).toBe("#X");
  });
});

describe("references of a document", () => {
  it("reports every kind, once each, and what changed", () => {
    const next = doc(
      paragraph(
        ref("page", "p_1", "Launch plan"),
        ref("tag", "t_2", "later"),
        ref("tag", "t_2", "later"),
      ),
    );
    const change = diffReferences(sample, next);
    expect(change.added.map((r) => `${r.kind}:${r.id}`)).toEqual(["tag:t_2"]);
    expect(change.removed.map((r) => `${r.kind}:${r.id}`)).toEqual([
      "tag:t_1",
      "date:2026-11-20",
      "date:2026-11-21T14:30",
      "user:u_1",
    ]);
    expect(change.all).toHaveLength(2);
  });
});

describe("date helpers", () => {
  it("validates days and times", () => {
    expect(isDateString("2026-11-20")).toBe(true);
    expect(isDateString("2026-02-29")).toBe(false);
    expect(isDateString("2024-02-29")).toBe(true);
    expect(isDateString("20-11-2026")).toBe(false);
    expect(isTimeString("00:00")).toBe(true);
    expect(isTimeString("24:00")).toBe(false);
    expect(isTimeString("9:05")).toBe(false);
  });

  it("builds and reads ids", () => {
    expect(dateId({ date: "2026-11-20" })).toBe("2026-11-20");
    expect(dateId({ date: "2026-11-20", time: "09:05" })).toBe("2026-11-20T09:05");
    expect(parseDateId("2026-11-20T09:05")).toEqual({ date: "2026-11-20", time: "09:05" });
    expect(parseDateId("2026-11-20")).toEqual({ date: "2026-11-20" });
    for (const bad of ["", "tomorrow", "2026-11-20T25:00", "2026-11-20T09:05T1", "2026-13-01"]) {
      expect(parseDateId(bad)).toBeUndefined();
    }
    expect(defaultDateLabel({ date: "2026-11-20", time: "09:05" })).toBe("2026-11-20 09:05");
  });

  it("moves across months, years and leap days", () => {
    expect(addDaysTo("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysTo("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysTo("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("understands shortcuts from a given today (a Friday)", () => {
    const today = "2026-11-20";
    expect(dateShortcut("today", today)).toEqual({ date: "2026-11-20" });
    expect(dateShortcut("Tomorrow", today)).toEqual({ date: "2026-11-21" });
    expect(dateShortcut("yesterday", today)).toEqual({ date: "2026-11-19" });
    expect(dateShortcut("next week", today)).toEqual({ date: "2026-11-27" });
    expect(dateShortcut("next-week", today)).toEqual({ date: "2026-11-27" });
    expect(dateShortcut("monday", today)).toEqual({ date: "2026-11-23" });
    expect(dateShortcut("friday", today)).toEqual({ date: "2026-11-27" });
    expect(dateShortcut("+3", today)).toEqual({ date: "2026-11-23" });
    expect(dateShortcut("-2d", today)).toEqual({ date: "2026-11-18" });
    expect(dateShortcut("2026-12-01", today)).toEqual({ date: "2026-12-01" });
    expect(dateShortcut("2026-12-01t14:30", today)).toEqual({ date: "2026-12-01", time: "14:30" });
    for (const bad of ["", "soon", "2026-02-30", "+", "tomorro"]) {
      expect(dateShortcut(bad, today)).toBeUndefined();
    }
  });

  it("tells a past day from a coming one, to the minute when there is a time", () => {
    const now = new Date(2026, 10, 20, 12, 0);
    expect(isPastDate({ date: "2026-11-19" }, now)).toBe(true);
    expect(isPastDate({ date: "2026-11-20" }, now)).toBe(false);
    expect(isPastDate({ date: "2026-11-21" }, now)).toBe(false);
    expect(isPastDate({ date: "2026-11-20", time: "11:59" }, now)).toBe(true);
    expect(isPastDate({ date: "2026-11-20", time: "12:00" }, now)).toBe(false);
    expect(isPastDate({ date: "2026-11-20", time: "18:00" }, now)).toBe(false);
  });
});
