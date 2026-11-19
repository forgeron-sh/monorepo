// @vitest-environment jsdom
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AddressField,
  FormBuilder,
  FormRenderer,
  MatrixField,
  QuestionCard,
  RankingField,
  ResponseSummary,
  ShareLinkPanel,
  cleanFormAnswers,
  convertFormQuestion,
  duplicateFormQuestion,
  emptyForm,
  formAllIds,
  formAnswerText,
  formConditionFields,
  formPages,
  formProblems,
  formResponseGrid,
  formVisibility,
  moveFormQuestion,
  moveFormQuestionTo,
  moveFormSection,
  newFormQuestion,
  parseFormAnswer,
  removeFormQuestion,
  summarizeForm,
  validateFormAnswer,
  validateFormAnswers,
  type ConditionGroup,
  type FormAnswers,
  type FormQuestion,
  type FormResponse,
  type FormSchema,
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
const key = async (el: Element, k: string, more: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...more }));
  });
const type = async (input: HTMLInputElement | HTMLTextAreaElement, value: string) =>
  act(async () => {
    const proto = Object.getPrototypeOf(input) as object;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const click = (el: Element) => act(async () => (el as HTMLElement).click());
const byText = (root: ParentNode, selector: string, text: string) =>
  [...root.querySelectorAll<HTMLElement>(selector)].find((e) => e.textContent?.trim() === text)!;

const eq = (id: string, field: string, value: string): ConditionGroup => ({
  id,
  combinator: "and",
  rules: [{ id: `${id}r`, field, operator: "eq", value }],
});

/** An intake form: who, a section for professionals only, then a survey page. */
const schema: FormSchema = {
  version: 1,
  title: "Intake",
  thanks: "Received.",
  sections: [
    {
      id: "s1",
      title: "About you",
      questions: [
        {
          id: "email",
          type: "shortText",
          title: "Email",
          required: true,
          validation: { format: "email" },
        },
        {
          id: "role",
          type: "singleChoice",
          title: "Who are you?",
          required: true,
          options: [
            { id: "student", label: "Student" },
            { id: "pro", label: "Professional" },
          ],
        },
        {
          id: "tools",
          type: "multiChoice",
          title: "Tools you use",
          options: [
            { id: "a", label: "Alpha" },
            { id: "b", label: "Beta" },
            { id: "c", label: "Gamma" },
          ],
          validation: { maxSelected: 2 },
        },
      ],
    },
    {
      id: "s2",
      title: "Your work",
      showIf: eq("g2", "role", "pro"),
      questions: [
        { id: "employer", type: "shortText", title: "Employer", required: true },
        {
          id: "years",
          type: "number",
          title: "Years of experience",
          validation: { min: 0, max: 60, integer: true },
        },
        {
          id: "alpha",
          type: "shortText",
          title: "What do you like in Alpha?",
          showIf: eq("g3", "tools", "a"),
        },
      ],
    },
    {
      id: "s3",
      title: "Feedback",
      questions: [
        {
          id: "nps",
          type: "scale",
          title: "Would you recommend us?",
          required: true,
          range: { min: 0, max: 10, nps: true },
        },
        {
          id: "grid",
          type: "matrix",
          title: "Rate",
          required: true,
          options: [
            { id: "r1", label: "Speed" },
            { id: "r2", label: "Price" },
          ],
          columns: [
            { id: "c1", label: "Poor" },
            { id: "c2", label: "Good" },
          ],
        },
        {
          id: "rank",
          type: "ranking",
          title: "Rank",
          options: [
            { id: "x", label: "Quality" },
            { id: "y", label: "Cost" },
            { id: "z", label: "Delay" },
          ],
        },
        { id: "where", type: "address", title: "Address" },
      ],
    },
  ],
};

describe("visibility", () => {
  it("shows a question only when its rule holds, and a hidden section hides its questions", () => {
    const none = formVisibility(schema, {});
    expect(none.sections.s2).toBe(false);
    expect(none.questions.employer).toBe(false);
    const pro = formVisibility(schema, { role: "pro" });
    expect(pro.sections.s2).toBe(true);
    expect(pro.questions.employer).toBe(true);
    expect(pro.questions.alpha).toBe(false);
  });
  it("reads a ticked box among several as true for `is`", () => {
    const v = formVisibility(schema, { role: "pro", tools: ["b", "a"] });
    expect(v.questions.alpha).toBe(true);
    expect(formVisibility(schema, { role: "pro", tools: ["b"] }).questions.alpha).toBe(false);
  });
  it("counts a hidden question as unanswered for the rules after it", () => {
    const chain: FormSchema = {
      ...emptyForm(),
      sections: [
        {
          id: "s",
          title: "",
          questions: [
            { id: "a", type: "shortText", title: "A" },
            { id: "b", type: "shortText", title: "B", showIf: eq("gb", "a", "yes") },
            { id: "c", type: "shortText", title: "C", showIf: eq("gc", "b", "go") },
          ],
        },
      ],
    };
    expect(formVisibility(chain, { a: "no", b: "go" }).questions.c).toBe(false);
    expect(formVisibility(chain, { a: "yes", b: "go" }).questions.c).toBe(true);
  });
  it("lists pages, skipping sections shown with no question", () => {
    expect(formPages(schema, {}).map((p) => p.section.id)).toEqual(["s1", "s3"]);
    expect(formPages(schema, { role: "pro" }).map((p) => p.section.id)).toEqual(["s1", "s2", "s3"]);
  });
  it("offers only the questions before as fields, with their options", () => {
    const fields = formConditionFields(schema, "alpha");
    expect(fields.map((f) => f.id)).toEqual(["email", "role", "tools", "employer", "years"]);
    expect(fields.find((f) => f.id === "role")).toMatchObject({
      type: "enum",
      options: [
        { value: "student", label: "Student" },
        { value: "pro", label: "Professional" },
      ],
    });
    expect(formConditionFields(schema, "s2").map((f) => f.id)).toEqual(["email", "role", "tools"]);
  });
});

describe("validation", () => {
  const q = (id: string) =>
    schema.sections.flatMap((s) => s.questions).find((x) => x.id === id) as FormQuestion;
  it("asks for required answers and says what to do", () => {
    expect(validateFormAnswer(q("email"), "")).toBe("Answer this question.");
    expect(validateFormAnswer(q("role"), null)).toBe("Choose an option.");
    expect(validateFormAnswer(q("tools"), [])).toBeNull();
  });
  it("checks format, limits and selections", () => {
    expect(validateFormAnswer(q("email"), "nope")).toMatch(/email address/);
    expect(validateFormAnswer(q("email"), "ada@example.com")).toBeNull();
    expect(validateFormAnswer(q("years"), 61)).toBe("Enter 60 or less.");
    expect(validateFormAnswer(q("years"), 2.5)).toBe("Enter a whole number.");
    expect(validateFormAnswer(q("tools"), ["a", "b", "c"])).toBe("Choose 2 options at most.");
  });
  it("needs every row of a required matrix and every item of a ranking", () => {
    expect(validateFormAnswer(q("grid"), { r1: "c1" })).toBe("Answer every row.");
    expect(validateFormAnswer(q("grid"), { r1: "c1", r2: "c2" })).toBeNull();
    expect(validateFormAnswer(q("rank"), ["x", "y"])).toBe("Rank every item.");
  });
  it("needs the four parts of a required address, not the second line", () => {
    const required = { ...q("where"), required: true };
    expect(validateFormAnswer(required, { line1: "1 Rue Neuve", city: "Lyon" })).toMatch(
      /Complete/,
    );
    expect(
      validateFormAnswer(required, {
        line1: "1 Rue Neuve",
        postcode: "69001",
        city: "Lyon",
        country: "France",
      }),
    ).toBeNull();
  });
  it("uses a pattern with its own message, and a bad pattern never blocks", () => {
    const code: FormQuestion = {
      id: "p",
      type: "shortText",
      title: "Code",
      validation: { pattern: "[A-Z]{2}[0-9]{2}", patternMessage: "Two letters, two digits." },
    };
    expect(validateFormAnswer(code, "AB12")).toBeNull();
    expect(validateFormAnswer(code, "AB123")).toBe("Two letters, two digits.");
    expect(validateFormAnswer({ ...code, validation: { pattern: "(" } }, "x")).toBeNull();
  });
  it("ignores hidden questions and drops their answers", () => {
    expect(Object.keys(validateFormAnswers(schema, { role: "student" }))).toEqual([
      "email",
      "nps",
      "grid",
    ]);
    const cleaned = cleanFormAnswers(schema, {
      email: " ada@example.com ",
      role: "student",
      employer: "Acme",
      tools: [],
    });
    expect(cleaned).toEqual({ email: "ada@example.com", role: "student" });
  });
});

describe("reading and writing answers", () => {
  const q = (id: string) =>
    schema.sections.flatMap((s) => s.questions).find((x) => x.id === id) as FormQuestion;
  it("reads options by label or id, lists, numbers, times and matrices", () => {
    expect(parseFormAnswer(q("role"), "professional")).toBe("pro");
    expect(parseFormAnswer(q("role"), "unknown")).toBeNull();
    expect(parseFormAnswer(q("tools"), "Alpha; gamma")).toEqual(["a", "c"]);
    expect(parseFormAnswer(q("tools"), "Alpha, nope")).toBeNull();
    expect(parseFormAnswer(q("years"), "3,5")).toBe(3.5);
    expect(parseFormAnswer(q("nps"), "11")).toBeNull();
    expect(parseFormAnswer({ id: "t", type: "time", title: "t" }, "9:05")).toBe("09:05");
    expect(parseFormAnswer(q("grid"), "Speed=Good;Price=Poor")).toEqual({ r1: "c2", r2: "c1" });
    expect(parseFormAnswer(q("where"), "1 Rue Neuve||69001|Lyon|France")).toMatchObject({
      line1: "1 Rue Neuve",
      city: "Lyon",
    });
    expect(parseFormAnswer(q("email"), "   ")).toBeNull();
  });
  it("writes an answer as a line", () => {
    expect(formAnswerText(q("tools"), ["a", "c"])).toBe("Alpha, Gamma");
    expect(formAnswerText(q("grid"), { r1: "c2", r2: "c1" })).toBe("Speed: Good; Price: Poor");
    expect(formAnswerText(q("rank"), ["y", "x", "z"])).toBe("1. Cost, 2. Quality, 3. Delay");
    expect(
      formAnswerText(q("where"), {
        line1: "1 Rue Neuve",
        postcode: "69001",
        city: "Lyon",
        country: "France",
      }),
    ).toBe("1 Rue Neuve, 69001 Lyon, France");
    expect(formAnswerText(q("email"), null)).toBe("");
  });
});

describe("editing the schema", () => {
  it("moves a question across the edge of a section", () => {
    const next = moveFormQuestion(schema, "tools", 1);
    expect(next.sections[0]!.questions.map((x) => x.id)).toEqual(["email", "role"]);
    expect(next.sections[1]!.questions[0]!.id).toBe("tools");
    expect(moveFormQuestion(schema, "email", -1)).toBe(schema);
    const same = moveFormQuestion(schema, "email", 1);
    expect(same.sections[0]!.questions.map((x) => x.id)).toEqual(["role", "email", "tools"]);
  });
  it("drops a rule that now reads a question that is gone", () => {
    const next = removeFormQuestion(schema, "role");
    expect(next.sections[1]!.showIf).toBeUndefined();
    expect(next.sections[1]!.questions[2]!.showIf).not.toBeUndefined();
    expect(removeFormQuestion(schema, "tools").sections[1]!.questions[2]!.showIf).toBeUndefined();
  });
  it("moves a question into another section at an index", () => {
    const next = moveFormQuestionTo(schema, "where", "s1", 0);
    expect(next.sections[0]!.questions[0]!.id).toBe("where");
    expect(next.sections[2]!.questions.map((x) => x.id)).toEqual(["nps", "grid", "rank"]);
    expect(moveFormSection(schema, "s3", -1).sections.map((s) => s.id)).toEqual(["s1", "s3", "s2"]);
  });
  it("duplicates with fresh ids, after the original", () => {
    const next = duplicateFormQuestion(schema, "role");
    const ids = formAllIds(next);
    expect(new Set(ids).size).toBe(ids.length);
    expect(next.sections[0]!.questions[2]!.title).toBe("Who are you? (copy)");
    expect(next.sections[0]!.questions[2]!.options).toHaveLength(2);
  });
  it("converts a type, keeping the words and the options that still fit", () => {
    const role = schema.sections[0]!.questions[1]!;
    const dropdown = convertFormQuestion(role, "dropdown");
    expect(dropdown).toMatchObject({ type: "dropdown", title: "Who are you?", required: true });
    expect(dropdown.options).toBe(role.options);
    const text = convertFormQuestion(role, "shortText");
    expect(text.options).toBeUndefined();
  });
  it("says what is wrong with a form", () => {
    expect(formProblems(emptyForm()).map((p) => p.message)).toEqual(["The form has no question."]);
    const bad: FormSchema = {
      ...emptyForm(),
      sections: [
        {
          id: "s",
          title: "",
          questions: [
            { ...newFormQuestion("singleChoice", "a", ["a"]), title: "" },
            {
              ...newFormQuestion("shortText", "b", ["b"]),
              title: "B",
              showIf: eq("g", "c", "x"),
              validation: { minLength: 5, maxLength: 2 },
            },
            { ...newFormQuestion("shortText", "c", ["c"]), title: "C" },
          ],
        },
      ],
    };
    const messages = formProblems(bad).map((p) => p.message);
    expect(messages).toContain("The question has no title.");
    expect(messages).toContain("The minimum length is above the maximum.");
    expect(messages).toContain("A show-if rule reads a question that comes later or is gone.");
    expect(formProblems(schema)).toEqual([]);
  });
});

const response = (id: string, answers: FormAnswers, submittedAt?: string): FormResponse => ({
  id,
  answers,
  ...(submittedAt ? { submittedAt } : {}),
});
const responses: FormResponse[] = [
  response(
    "r1",
    {
      email: "a@example.com",
      role: "pro",
      employer: "Acme",
      nps: 10,
      grid: { r1: "c2", r2: "c2" },
      rank: ["x", "y", "z"],
    },
    "2026-11-01",
  ),
  response(
    "r2",
    {
      email: "b@example.com",
      role: "student",
      nps: 3,
      grid: { r1: "c1", r2: "c2" },
      rank: ["y", "x", "z"],
    },
    "2026-11-02",
  ),
  response("r3", { email: "c@example.com", role: "pro", nps: 8, grid: { r1: "c2" } }, "2026-11-03"),
];

describe("summary", () => {
  const sum = summarizeForm(schema, responses);
  const of = (id: string) => sum.questions.find((s) => s.question.id === id)!;
  it("counts choices as shares of the people who answered", () => {
    expect(of("role").buckets.map((b) => [b.label, b.count])).toEqual([
      ["Student", 1],
      ["Professional", 2],
    ]);
    expect(of("role").buckets[1]!.share).toBeCloseTo(2 / 3);
  });
  it("counts a question only for the responses that were shown it", () => {
    expect(of("employer").asked).toBe(2);
    expect(of("employer").answered).toBe(1);
    expect(of("employer").skipped).toBe(1);
    expect(of("employer").texts).toEqual(["Acme"]);
  });
  it("reads a scale as a histogram and an NPS", () => {
    const nps = of("nps");
    expect(nps.kind).toBe("histogram");
    expect(nps.buckets).toHaveLength(11);
    expect(nps.mean).toBe(7);
    expect(nps.median).toBe(8);
    expect(nps.nps).toEqual({ promoters: 1, passives: 1, detractors: 1, score: 0 });
  });
  it("ranks by points and works out a matrix", () => {
    expect(of("rank").buckets.map((b) => [b.label, b.count])).toEqual([
      ["Quality", 5],
      ["Cost", 5],
      ["Delay", 2],
    ]);
    expect(of("grid").matrix!.rows[0]!.counts).toEqual([1, 2]);
  });
  it("tells how many finished", () => {
    expect(sum.responses).toBe(3);
    // r3 has no full matrix answer and no employer: only r1 and r2 are complete.
    expect(sum.completion).toBeCloseTo(2 / 3);
    expect(summarizeForm(schema, []).completion).toBe(0);
  });
  it("turns responses into DataGrid columns and rows", () => {
    const grid = formResponseGrid(schema, responses);
    expect(grid.columns.slice(0, 3).map((c) => c.name)).toEqual(["Response", "Submitted", "Email"]);
    expect(grid.columns.find((c) => c.name === "Would you recommend us?")).toMatchObject({
      numeric: true,
      type: "scale",
    });
    expect(grid.rows).toHaveLength(3);
    const employer = grid.columns.findIndex((c) => c.name === "Employer");
    expect(grid.rows.map((r) => r[employer])).toEqual(["Acme", null, null]);
    const role = grid.columns.findIndex((c) => c.name === "Who are you?");
    expect(grid.rows[0]![role]).toBe("Professional");
  });
});

describe("RankingField", () => {
  const items = [
    { id: "x", label: "Quality" },
    { id: "y", label: "Cost" },
    { id: "z", label: "Delay" },
  ];
  it("moves the item with Alt and the arrows, and says where it went", async () => {
    const onChange = vi.fn<(v: string[] | null) => void>();
    const root = await mount(h(RankingField, { label: "Rank", items, onChange }));
    expect(root.querySelector(".fg-fm-rank-fresh")).not.toBeNull();
    const cost = root.querySelector<HTMLElement>('[data-item="y"] .fg-fm-rank-main')!;
    await key(cost, "ArrowUp", { altKey: true });
    expect(onChange).toHaveBeenLastCalledWith(["y", "x", "z"]);
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toBe("Cost, place 1 of 3");
    expect(root.querySelector(".fg-fm-rank-fresh")).toBeNull();
    await key(cost, "ArrowUp", { altKey: true });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it("accepts the given order with a button, and moves with the arrow buttons", async () => {
    const onChange = vi.fn<(v: string[] | null) => void>();
    const root = await mount(h(RankingField, { label: "Rank", items, onChange }));
    await click(byText(root, "button", "Keep this order"));
    expect(onChange).toHaveBeenLastCalledWith(["x", "y", "z"]);
    await click(root.querySelector('[aria-label="Move Delay up"]')!);
    expect(onChange).toHaveBeenLastCalledWith(["x", "z", "y"]);
    expect(root.querySelector('[aria-label="Move Quality up"]')!.hasAttribute("disabled")).toBe(
      true,
    );
  });
  it("moves the focus with the plain arrows", async () => {
    const root = await mount(h(RankingField, { label: "Rank", items }));
    const first = root.querySelector<HTMLElement>('[data-item="x"] .fg-fm-rank-main')!;
    first.focus();
    await key(first, "ArrowDown");
    await act(async () => new Promise<void>((r) => requestAnimationFrame(() => r())));
    expect(document.activeElement).toBe(root.querySelector('[data-item="y"] .fg-fm-rank-main'));
  });
});

describe("MatrixField", () => {
  const rows = [
    { id: "r1", label: "Speed" },
    { id: "r2", label: "Price" },
  ];
  const columns = [
    { id: "c1", label: "Poor" },
    { id: "c2", label: "Good" },
  ];
  it("holds one radio per row, named by the row and the column", async () => {
    const onChange = vi.fn<(v: unknown) => void>();
    const root = await mount(h(MatrixField, { label: "Rate", rows, columns, onChange }));
    await click(root.querySelector('[aria-label="Speed: Good"]')!);
    expect(onChange).toHaveBeenLastCalledWith({ r1: "c2" });
    await click(root.querySelector('[aria-label="Speed: Poor"]')!);
    expect(onChange).toHaveBeenLastCalledWith({ r1: "c1" });
    expect(root.querySelectorAll('input[type="radio"]')).toHaveLength(4);
  });
  it("takes several columns on a row with `multiple`", async () => {
    const onChange = vi.fn<(v: unknown) => void>();
    const root = await mount(
      h(MatrixField, { label: "Rate", rows, columns, multiple: true, onChange }),
    );
    await click(root.querySelector('[aria-label="Speed: Poor"]')!);
    await click(root.querySelector('[aria-label="Speed: Good"]')!);
    expect(onChange).toHaveBeenLastCalledWith({ r1: ["c1", "c2"] });
    await click(root.querySelector('[aria-label="Speed: Poor"]')!);
    expect(onChange).toHaveBeenLastCalledWith({ r1: ["c2"] });
  });
});

describe("AddressField", () => {
  it("writes each part and gives the browser its autocomplete names", async () => {
    const onChange = vi.fn<(v: unknown) => void>();
    const root = await mount(h(AddressField, { label: "Address", onChange }));
    const city = root.querySelector<HTMLInputElement>('input[autocomplete="address-level2"]')!;
    await type(city, "Lyon");
    expect(onChange).toHaveBeenLastCalledWith({ city: "Lyon" });
    expect(root.querySelector('input[autocomplete="postal-code"]')).not.toBeNull();
    expect(root.querySelectorAll("input")).toHaveLength(5);
  });
  it("marks the optional line and shows the errors by part", () => {
    const out = html(
      h(AddressField, { label: "Address", required: true, errors: { city: "Required" } }),
    );
    expect(out).toContain("Address line 2 (optional)");
    expect(out).toContain("Required");
  });
});

describe("QuestionCard", () => {
  const card = (props: Partial<Parameters<typeof QuestionCard>[0]> = {}) =>
    h(QuestionCard, {
      defaultValue: schema.sections[0]!.questions[1]!,
      defaultOpen: true,
      index: 2,
      ...props,
    });
  it("edits the title in place and tells the parent", async () => {
    const onChange = vi.fn<(q: FormQuestion) => void>();
    const root = await mount(card({ onChange }));
    const title = root.querySelector<HTMLInputElement>(
      'input[placeholder="What do you want to ask?"]',
    )!;
    await type(title, "Which one?");
    expect(onChange.mock.lastCall![0]).toMatchObject({ id: "role", title: "Which one?" });
    expect(root.querySelector(".fg-fm-qc-title")?.textContent).toBe("Which one?");
  });
  it("adds an option with Enter, removes an empty one with Backspace, moves with Alt", async () => {
    const onChange = vi.fn<(q: FormQuestion) => void>();
    const root = await mount(card({ onChange }));
    const first = root.querySelector<HTMLInputElement>('input[aria-label="Option 1"]')!;
    await key(first, "Enter");
    expect(onChange.mock.lastCall![0].options!.map((o) => o.label)).toEqual([
      "Student",
      "",
      "Professional",
    ]);
    const added = root.querySelector<HTMLInputElement>('input[aria-label="Option 2"]')!;
    await key(added, "Backspace");
    expect(onChange.mock.lastCall![0].options!.map((o) => o.label)).toEqual([
      "Student",
      "Professional",
    ]);
    await key(root.querySelector('input[aria-label="Option 2"]')!, "ArrowUp", { altKey: true });
    expect(onChange.mock.lastCall![0].options!.map((o) => o.label)).toEqual([
      "Professional",
      "Student",
    ]);
  });
  it("keeps at least the minimum of options", async () => {
    const root = await mount(card({ defaultValue: newFormQuestion("ranking", "r") }));
    expect(root.querySelectorAll(".fg-fm-opt")).toHaveLength(3);
    const remove = root.querySelector('[aria-label="Remove item 3"]')!;
    await click(remove);
    expect(root.querySelectorAll(".fg-fm-opt")).toHaveLength(2);
    expect(root.querySelector('[aria-label="Remove item 2"]')!.hasAttribute("disabled")).toBe(true);
  });
  it("reorders from its row with Alt and the arrows, and opens and closes", async () => {
    const onMove = vi.fn<(d: number) => void>();
    const root = await mount(card({ onMove, defaultOpen: false }));
    const row = root.querySelector<HTMLElement>(".fg-fm-qc-main")!;
    expect(row.getAttribute("aria-expanded")).toBe("false");
    expect(row.getAttribute("aria-keyshortcuts")).toBe("Alt+ArrowUp Alt+ArrowDown");
    await key(row, "ArrowDown", { altKey: true });
    expect(onMove).toHaveBeenCalledWith(1);
    await click(row);
    expect(row.getAttribute("aria-expanded")).toBe("true");
    expect(root.querySelector(".fg-fm-qc-body")).not.toBeNull();
  });
  it("shows the problems it is given, and duplicates and deletes", async () => {
    const onDuplicate = vi.fn<() => void>();
    const onDelete = vi.fn<() => void>();
    const root = await mount(
      card({ problems: ["Give at least two options."], onDuplicate, onDelete }),
    );
    expect(root.querySelector(".fg-fm-qc-problems")?.textContent).toContain("two options");
    expect(root.querySelector(".fg-fm-qc-flag-bad")?.textContent).toBe("1 problem");
    await click(root.querySelector('[aria-label="Duplicate question"]')!);
    await click(root.querySelector('[aria-label="Delete question"]')!);
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
  it("shows the limits of a number", () => {
    const out = html(
      h(QuestionCard, { value: schema.sections[1]!.questions[1]!, defaultOpen: true }),
    );
    expect(out).toContain("Minimum");
    expect(out).toContain("Whole numbers only");
  });
});

describe("FormRenderer", () => {
  const fill = async (root: HTMLElement) => {
    await type(root.querySelector<HTMLInputElement>('input[type="email"]')!, "ada@example.com");
  };
  it("holds the first page back until the required answers are given, then moves on", async () => {
    const root = await mount(h(FormRenderer, { schema }));
    expect(root.querySelector('[role="progressbar"], .fg-progress')?.textContent).toContain(
      "Page 1 of 2",
    );
    await click(byText(root, "button", "Next"));
    expect(root.querySelectorAll(".fg-fm-q-error").length).toBe(2);
    expect(root.querySelector(".fg-fm-notice")?.textContent).toBe("2 questions need attention.");
    expect(root.querySelector('input[type="email"]')!.getAttribute("aria-invalid")).toBe("true");
    await fill(root);
    await click(root.querySelector('input[type="radio"][value="student"]')!);
    await click(byText(root, "button", "Next"));
    expect(root.querySelector(".fg-fm-section")?.textContent).toBe("Feedback");
  });
  it("adds the work page when the answer asks for it, and a follow-up question inside it", async () => {
    const root = await mount(h(FormRenderer, { schema }));
    await fill(root);
    await click(root.querySelector('input[type="radio"][value="pro"]')!);
    const boxes = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    await click(boxes[0]!);
    expect(root.querySelector(".fg-progress")?.textContent).toContain("Page 1 of 3");
    await click(byText(root, "button", "Next"));
    expect(root.querySelector(".fg-fm-section")?.textContent).toBe("Your work");
    expect(root.textContent).toContain("What do you like in Alpha?");
  });
  it("goes through the review and hands over typed answers without the hidden ones", async () => {
    const onSubmit = vi.fn<(a: FormAnswers) => void>();
    const root = await mount(h(FormRenderer, { schema, onSubmit }));
    await fill(root);
    await click(root.querySelector('input[type="radio"][value="student"]')!);
    await click(byText(root, "button", "Next"));
    await click(byText(root, '.fg-scale [role="radio"]', "9"));
    await click(root.querySelector('[aria-label="Speed: Good"]')!);
    await click(root.querySelector('[aria-label="Price: Poor"]')!);
    await click(byText(root, "button", "Review"));
    expect(
      root.querySelector(
        "#" + CSS.escape(root.querySelector(".fg-fm-review")!.getAttribute("aria-labelledby")!),
      )?.textContent,
    ).toBe("Review your answers");
    const text = root.querySelector(".fg-fm-review")!.textContent!;
    expect(text).toContain("ada@example.com");
    expect(text).toContain("Student");
    expect(text).toContain("Speed: Good; Price: Poor");
    await click(byText(root, "button", "Submit"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const sent = onSubmit.mock.lastCall![0];
    expect(sent.email).toBe("ada@example.com");
    expect(sent.role).toBe("student");
    expect(sent.grid).toEqual({ r1: "c2", r2: "c1" });
    expect(sent.nps).toBe(9);
    expect("employer" in sent).toBe(false);
    expect(root.querySelector(".fg-fm-thanks-text")?.textContent).toBe("Received.");
  });
  it("sends everything from one page with `single`, and refuses while a problem stands", async () => {
    const onSubmit = vi.fn<(a: FormAnswers) => void>();
    const root = await mount(h(FormRenderer, { schema, onSubmit, layout: "single" }));
    expect(root.querySelectorAll(".fg-fm-page").length).toBe(2);
    await click(byText(root, "button", "Submit"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(root.querySelector(".fg-fm-notice")?.textContent).toMatch(/need attention/);
  });
  it("is controlled when given its answers", async () => {
    const onChange = vi.fn<(a: FormAnswers) => void>();
    const root = await mount(
      h(FormRenderer, { schema, value: { email: "x@example.com" }, onChange }),
    );
    expect(root.querySelector<HTMLInputElement>('input[type="email"]')!.value).toBe(
      "x@example.com",
    );
    await click(root.querySelector('input[type="radio"][value="pro"]')!);
    expect(onChange.mock.lastCall![0]).toEqual({ email: "x@example.com", role: "pro" });
  });
});

describe("FormBuilder", () => {
  const Harness = ({ onChange }: { onChange?: (s: FormSchema) => void }) => {
    const [value, setValue] = useState(schema);
    return h(FormBuilder, {
      value,
      onChange: (next: FormSchema) => {
        setValue(next);
        onChange?.(next);
      },
    });
  };
  it("lists every question as a card, numbered in order across pages", async () => {
    const root = await mount(h(Harness));
    const numbers = [...root.querySelectorAll(".fg-fm-qc-n")].map((n) => n.textContent);
    expect(numbers).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(root.querySelector(".fg-fm-toolbar-ok")?.textContent).toBe("Ready to share");
  });
  it("moves a question with Alt and the arrows, across a page edge, and keeps the focus on it", async () => {
    const onChange = vi.fn<(s: FormSchema) => void>();
    const root = await mount(h(Harness, { onChange }));
    const tools = root.querySelector<HTMLElement>('[data-question="tools"] .fg-fm-qc-main')!;
    await key(tools, "ArrowDown", { altKey: true });
    const next = onChange.mock.lastCall![0];
    expect(next.sections[1]!.questions[0]!.id).toBe("tools");
    await act(async () => new Promise<void>((r) => requestAnimationFrame(() => r())));
    expect(document.activeElement).toBe(
      root.querySelector('[data-question="tools"] .fg-fm-qc-main'),
    );
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain(
      "Tools you use, position 1 of 4",
    );
  });
  it("opens a card to edit, writes the logic of a question, and flags a problem", async () => {
    const onChange = vi.fn<(s: FormSchema) => void>();
    const root = await mount(h(Harness, { onChange }));
    await click(root.querySelector('[data-question="role"] .fg-fm-qc-main')!);
    const title = root.querySelector<HTMLInputElement>(
      '[data-question="role"] input[placeholder="What do you want to ask?"]',
    )!;
    await type(title, "");
    expect(root.querySelector(".fg-fm-toolbar-bad")?.textContent).toBe("1 problem to fix");
    expect(root.querySelector('[data-question="role"] .fg-fm-qc-problems')?.textContent).toContain(
      "no title",
    );
    await click(byText(root, "button", "Show this question only if…"));
    expect(onChange.mock.lastCall![0].sections[0]!.questions[1]!.showIf).toBeDefined();
  });
  it("switches to a preview that is the real form", async () => {
    const root = await mount(h(Harness));
    await click(byText(root, ".fg-seg-item", "Preview"));
    expect(root.querySelector(".fg-fm-preview-note")?.textContent).toContain(
      "Answers are not saved",
    );
    expect(root.querySelector("form.fg-fm")).not.toBeNull();
    expect(root.querySelector('input[type="email"]')).not.toBeNull();
  });
});

describe("ResponseSummary and ShareLinkPanel", () => {
  it("draws a chart per question and the numbers on top", () => {
    const out = html(h(ResponseSummary, { schema, responses }));
    expect(out).toContain("Responses");
    expect(out).toContain("67 %");
    expect(out).toContain("NPS");
    expect(out).toContain("Professional");
    expect(out).toContain("shown to 2");
    expect(out).toContain("avg place");
  });
  it("says so when nothing came back", () => {
    expect(html(h(ResponseSummary, { schema, responses: [] }))).toContain("No response yet.");
  });
  it("closes the form with the switch", async () => {
    const onOpenChange = vi.fn<(o: boolean) => void>();
    const root = await mount(h(ShareLinkPanel, { url: "https://example.com/f/abc", onOpenChange }));
    expect(root.textContent).toContain("https://example.com/f/abc");
    await click(root.querySelector('[role="switch"]')!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(root.querySelector(".fg-fm-share-closed")).not.toBeNull();
  });
});
