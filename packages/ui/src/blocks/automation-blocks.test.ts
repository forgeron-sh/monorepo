// @vitest-environment jsdom
import { BoltIcon, Clock01Icon, GitForkIcon, Mail01Icon, Message01Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AutomationList,
  AutomationListBody,
  AutomationListHeader,
  AutomationListName,
  AutomationListRow,
  ChangeList,
  ChangeListItem,
  ConditionBuilder,
  cronToSpec,
  describeCondition,
  describeCron,
  evaluateCondition,
  ExpressionInput,
  findStep,
  findTokens,
  flattenSteps,
  formatDuration,
  highlightJson,
  insertStep,
  insertToken,
  JsonView,
  moveStep,
  nextRuns,
  PublishBar,
  PublishBarPublish,
  PublishBarState,
  PublishDialog,
  PublishDialogChanges,
  PublishDialogContent,
  PublishDialogFooter,
  PublishDialogMessage,
  removeStep,
  resolveTemplate,
  RunBars,
  RunList,
  RunListDays,
  RunListFilter,
  ScheduleEditor,
  ScheduleEditorModes,
  ScheduleEditorNext,
  ScheduleEditorSummary,
  specToCron,
  StepCard,
  StepCardError,
  StepCardMain,
  StepCardState,
  StepCardText,
  StepCardTitle,
  StepCardTrigger,
  StepFields,
  StepField,
  StepInspector,
  StepInspectorHeader,
  StepInspectorTabs,
  StepList,
  StepListEmpty,
  StepListSteps,
  StepPicker,
  StepPickerList,
  StepPickerSearch,
  StepSettings,
  StepSettingsOnError,
  VersionHistory,
  VersionHistoryDetail,
  VersionHistoryList,
  tokenQueryAt,
  variablesFromSample,
  type AutomationStep,
  type ConditionField,
  type ConditionGroup,
  type StepPlace,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
const roots: Array<ReturnType<typeof createRoot>> = [];
// Unmount, not only remove: a portalled dialog left open keeps its focus trap on the body and
// takes the focus of the next test.
afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  host?.remove();
  host = undefined;
  document.body.innerHTML = "";
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(element));
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });
const click = async (el: Element | null | undefined) =>
  act(async () => {
    (el as HTMLElement).click();
  });
/** Types into a controlled field the way React hears it. */
const type = async (el: HTMLInputElement | HTMLTextAreaElement, text: string) =>
  act(async () => {
    const proto = Object.getPrototypeOf(el) as object;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, text);
    el.setSelectionRange(text.length, text.length);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

const tree: AutomationStep[] = [
  { id: "t", title: "Deal won", icon: BoltIcon, kind: "trigger" },
  {
    id: "if",
    title: "Big deal?",
    icon: GitForkIcon,
    kind: "logic",
    branches: [
      {
        id: "yes",
        label: "true",
        steps: [{ id: "mail", title: "Mail the CFO", icon: Mail01Icon }],
      },
      { id: "no", label: "false", steps: [] },
    ],
  },
  { id: "chat", title: "Post in Chat", icon: Message01Icon },
];

describe("steps", () => {
  it("finds, flattens, inserts, moves and removes steps in branches", () => {
    expect(findStep(tree, "mail")?.place).toEqual({ branch: "yes", index: 0 });
    expect(flattenSteps(tree).map((s) => s.id)).toEqual(["t", "if", "mail", "chat"]);
    const added = insertStep(
      tree,
      { id: "x", title: "X", icon: BoltIcon },
      { branch: "no", index: 0 },
    );
    expect(findStep(added, "x")?.place).toEqual({ branch: "no", index: 0 });
    expect(moveStep(tree, "chat", -1).map((s) => s.id)).toEqual(["t", "chat", "if"]);
    expect(moveStep(tree, "t", -1)).toEqual(tree);
    expect(findStep(removeStep(tree, "mail"), "mail")).toBeNull();
    expect(findStep(removeStep(tree, "if"), "mail")).toBeNull();
  });
});

describe("references", () => {
  it("finds the reference being typed and closes it on insert", () => {
    expect(findTokens("Hi {{ deal.name }}!")).toEqual([{ from: 3, to: 18, path: "deal.name" }]);
    expect(tokenQueryAt("Total: {{ deal.am", 17)).toEqual({ from: 10, query: "deal.am" });
    expect(tokenQueryAt("{{ a }} b", 9)).toBeNull();
    const out = insertToken("Total: {{ deal.am", 10, 17, "deal.amount");
    expect(out.text).toBe("Total: {{ deal.amount }}");
    expect(out.caret).toBe(out.text.length);
    expect(insertToken("{{", 2, 2, "a").text).toBe("{{ a }}");
    expect(insertToken("{{ x }}", 3, 4, "a.b").text).toBe("{{ a.b }}");
  });
  it("resolves a text against data, keeping a lone reference's type", () => {
    const data = { deal: { amount: 9600, name: "Transalp" } };
    expect(resolveTemplate("{{ deal.amount }}", data).value).toBe(9600);
    expect(resolveTemplate("Won {{ deal.name }} for {{ deal.amount }}", data).value).toBe(
      "Won Transalp for 9600",
    );
    expect(resolveTemplate("{{ deal.nope }}", data).missing).toEqual(["deal.nope"]);
  });
  it("lists the paths of a sample", () => {
    const v = variablesFromSample("deal", "Deal won", {
      id: 4,
      owner: { name: "Léa" },
      lines: [1, 2],
    });
    expect(v.fields).toEqual([
      { path: "deal.id", hint: "4" },
      { path: "deal.owner.name", hint: "Léa" },
      { path: "deal.lines", hint: "2 items" },
    ]);
  });
});

describe("cron", () => {
  it("says common schedules in words", () => {
    expect(describeCron("*/15 * * * *")).toBe("Every 15 minutes");
    expect(describeCron("0 * * * *")).toBe("Every hour");
    expect(describeCron("30 */2 * * *")).toBe("Every 2 hours at :30");
    expect(describeCron("0 8 * * *")).toBe("Every day at 08:00");
    expect(describeCron("0 8 * * 1-5")).toBe("Weekdays at 08:00");
    expect(describeCron("0 9 * * 1,4")).toBe("Mondays and Thursdays at 09:00");
    expect(describeCron("0 9,17 * * *")).toBe("Every day at 09:00 and 17:00");
    expect(describeCron("15 6 1 * *")).toBe("Monthly on the 1st at 06:15");
    expect(describeCron("0 8 * 1 *")).toBe("Custom schedule");
    expect(describeCron("61 * * * *")).toBeNull();
    expect(describeCron("nope")).toBeNull();
  });
  it("lists the next runs after a time, without the clock", () => {
    // 2026-11-20 is a Friday.
    expect(nextRuns("0 8 * * 1-5", "2026-11-20T09:00", 2)).toEqual([
      "2026-11-23T08:00",
      "2026-11-24T08:00",
    ]);
    expect(nextRuns("*/30 * * * *", "2026-11-20T09:10", 2)).toEqual([
      "2026-11-20T09:30",
      "2026-11-20T10:00",
    ]);
  });
  it("round-trips the shapes of the editor", () => {
    for (const cron of [
      "*/15 * * * *",
      "5 * * * *",
      "0 */3 * * *",
      "30 7 * * *",
      "0 8 * * 1,3,5",
      "0 6 12 * *",
    ]) {
      expect(specToCron(cronToSpec(cron))).toBe(cron);
    }
    expect(cronToSpec("0 8 * 1 *").mode).toBe("cron");
  });
});

const fields: ConditionField[] = [
  { id: "deal.amount", label: "Amount", type: "number" },
  {
    id: "deal.stage",
    label: "Stage",
    type: "enum",
    options: [
      { value: "won", label: "Won" },
      { value: "lost", label: "Lost" },
    ],
  },
  { id: "deal.vip", label: "VIP", type: "boolean" },
];
const condition: ConditionGroup = {
  id: "root",
  combinator: "and",
  rules: [
    { id: "a", field: "deal.amount", operator: "gt", value: "5000" },
    {
      id: "g",
      combinator: "or",
      rules: [
        { id: "b", field: "deal.stage", operator: "eq", value: "won" },
        { id: "c", field: "deal.vip", operator: "is_true" },
      ],
    },
  ],
};

describe("conditions", () => {
  it("evaluates nested groups and says them in a line", () => {
    expect(evaluateCondition(condition, { deal: { amount: 9600, stage: "won" } })).toBe(true);
    expect(evaluateCondition(condition, { deal: { amount: 9600, stage: "lost", vip: true } })).toBe(
      true,
    );
    expect(evaluateCondition(condition, { deal: { amount: 900, stage: "won" } })).toBe(false);
    expect(evaluateCondition({ id: "e", combinator: "and", rules: [] }, {})).toBe(true);
    expect(describeCondition(condition, fields)).toBe(
      "Amount is more than 5000 and (Stage is Won or VIP is true)",
    );
  });
  it("switches and / or at the join of two rows", async () => {
    const onChange = vi.fn<(value: ConditionGroup) => void>();
    const root = await mount(h(ConditionBuilder, { fields, defaultValue: condition, onChange }));
    expect(root.textContent).toContain("Where");
    const sw = root.querySelector<HTMLButtonElement>(".fg-cond-switch")!;
    expect(sw.textContent).toBe("and");
    await click(sw);
    expect(onChange.mock.calls[0]![0].combinator).toBe("or");
  });
});

describe("StepCard", () => {
  it("says its state in words, and the error of a failed run", () => {
    const ok = html(
      h(StepCard, {
        title: "Post",
        icon: Message01Icon,
        status: "success",
        meta: "120 ms · 1 item",
      }),
    );
    expect(ok).toContain("Succeeded");
    expect(ok).toContain("120 ms · 1 item");
    const failed = html(
      h(StepCard, { title: "Post", icon: Message01Icon, status: "error", error: "503 from Chat" }),
    );
    expect(failed).toContain("Failed");
    expect(failed).toContain("503 from Chat");
    expect(html(h(StepCard, { title: "Start", icon: BoltIcon, kind: "trigger" }))).toContain(
      "Trigger",
    );
  });
});

describe("StepList", () => {
  it("shows branches under bands, moves a step with Alt+Down and removes it", async () => {
    const onChange = vi.fn<(steps: ReadonlyArray<AutomationStep>) => void>();
    const onInsert = vi.fn<(place: StepPlace) => void>();
    const root = await mount(h(StepList, { defaultSteps: tree, onChange, onInsert }));
    expect([...root.querySelectorAll(".fg-steps-band")].map((b) => b.textContent)).toEqual([
      "true",
      "false",
    ]);
    const first = root.querySelector('[data-step="t"] .fg-step-main')!;
    await key(first, "ArrowDown", { altKey: true });
    expect(onChange.mock.calls[0]![0].map((s: AutomationStep) => s.id)).toEqual([
      "if",
      "t",
      "chat",
    ]);
    await click(root.querySelector('[aria-label="Remove Post in Chat"]'));
    expect(onChange.mock.calls[1]![0].map((s: AutomationStep) => s.id)).toEqual(["if", "t"]);
    await click(root.querySelector('[aria-label="Add a step at the end"]'));
    expect(onInsert).toHaveBeenLastCalledWith({ index: 2 });
  });
});

describe("StepList keyboard", () => {
  it("moves the focus between the step buttons with the arrows", async () => {
    const root = await mount(
      h(StepList, { defaultSteps: tree, onSelect: vi.fn<(id: string) => void>() }),
    );
    const mains = [...root.querySelectorAll<HTMLElement>("[data-collection-item]")];
    expect(mains.filter((m) => m.tabIndex === 0)).toHaveLength(1);
    await act(async () => mains[0]!.focus());
    await key(mains[0]!, "ArrowDown");
    await act(async () => new Promise<void>((r) => requestAnimationFrame(() => r())));
    expect(document.activeElement).toBe(mains[1]);
    await key(mains[1]!, "End");
    await act(async () => new Promise<void>((r) => requestAnimationFrame(() => r())));
    expect(document.activeElement).toBe(mains.at(-1));
    await key(mains.at(-1)!, "ArrowUp");
    await act(async () => new Promise<void>((r) => requestAnimationFrame(() => r())));
    expect(document.activeElement).toBe(mains.at(-2));
  });
});

describe("StepPicker", () => {
  it("filters as it is typed and adds with Enter", async () => {
    const onPick = vi.fn<(id: string) => void>();
    const root = await mount(
      h(StepPicker, {
        onPick,
        options: [
          { id: "schedule", label: "Schedule", icon: Clock01Icon, group: "trigger" },
          { id: "mail", label: "Send mail", app: "Mail relay", icon: Mail01Icon, group: "apps" },
          { id: "chat", label: "Post message", app: "Chat", icon: Message01Icon, group: "apps" },
        ],
      }),
    );
    const input = root.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await type(input, "chat");
    expect(root.querySelectorAll('[role="option"]')).toHaveLength(1);
    await key(input, "Enter");
    expect(onPick).toHaveBeenCalledWith("chat");
    await type(input, "");
    await key(input, "ArrowDown");
    await key(input, "Enter");
    expect(onPick).toHaveBeenLastCalledWith("mail");
  });
});

describe("ExpressionInput", () => {
  it("opens the outputs on {{ and writes the reference", async () => {
    const onChange = vi.fn<(value: string) => void>();
    const root = await mount(
      h(ExpressionInput, {
        "aria-label": "Message",
        defaultValue: "",
        onChange,
        variables: [variablesFromSample("deal", "Deal won", { name: "Transalp", amount: 9600 })],
        sample: { deal: { name: "Transalp", amount: 9600 } },
      }),
    );
    const input = root.querySelector<HTMLInputElement>("input")!;
    await type(input, "Won {{ deal.am");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(root.querySelectorAll('[role="option"]')).toHaveLength(1);
    await key(input, "Enter");
    expect(onChange).toHaveBeenLastCalledWith("Won {{ deal.amount }}");
    expect(root.querySelector(".fg-expr-token")?.textContent).toBe("{{ deal.amount }}");
    expect(root.querySelector(".fg-expr-preview")?.textContent).toContain("Won 9600");
  });
});

describe("ScheduleEditor", () => {
  it("says the schedule in words and lists the next runs", () => {
    const out = html(
      h(ScheduleEditor, {
        defaultValue: "0 8 * * 1-5",
        timezone: "Europe/Paris",
        from: "2026-11-20T09:00",
      }),
    );
    expect(out).toContain("Weekdays at 08:00");
    expect(out).toContain("Europe/Paris");
    expect(out).toContain("Mon 2026-11-23 08:00");
    expect(html(h(ScheduleEditor, { defaultValue: "bad" }))).toContain("Not a valid cron");
  });
});

describe("runs", () => {
  it("groups runs by day and writes the error of a failed one", () => {
    const out = html(
      h(RunList, {
        today: "2026-11-18",
        runs: [
          {
            id: "1204",
            status: "error",
            at: "2026-11-18 09:15:02",
            durationMs: 1400,
            detail: "Send: 503",
          },
          { id: "1203", status: "success", at: "2026-11-17 08:00:00", durationMs: 320 },
        ],
      }),
    );
    expect(out).toContain("Today · ");
    expect(out).toContain("Yesterday · ");
    expect(out).toContain("Send: 503");
    expect(out).toContain("1.4 s");
  });
  it("moves between the runs with the arrows, Home and End", async () => {
    const root = await mount(
      h(RunList, {
        onSelect: vi.fn<(id: string) => void>(),
        runs: [
          { id: "3", status: "success", at: "2026-11-18 09:00:00" },
          { id: "2", status: "error", at: "2026-11-18 08:00:00" },
          { id: "1", status: "success", at: "2026-11-17 08:00:00" },
        ],
      }),
    );
    const rows = [...root.querySelectorAll<HTMLElement>(".fg-runs-row")];
    expect(rows.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    await act(async () => rows[0]!.focus());
    await key(rows[0]!, "ArrowDown");
    expect(document.activeElement).toBe(rows[1]);
    await key(rows[1]!, "ArrowDown");
    expect(document.activeElement).toBe(rows[2]);
    await key(rows[2]!, "ArrowUp");
    expect(document.activeElement).toBe(rows[1]);
    await key(rows[1]!, "End");
    expect(document.activeElement).toBe(rows[2]);
    await key(rows[2]!, "Home");
    expect(document.activeElement).toBe(rows[0]);
  });
  it("writes durations", () => {
    expect(formatDuration(120)).toBe("120 ms");
    expect(formatDuration(1400)).toBe("1.4 s");
    expect(formatDuration(125_000)).toBe("2 min 05 s");
  });
});

describe("publishing", () => {
  it("says where the draft stands", () => {
    expect(html(h(PublishBar, { changes: 0 }))).toContain("Never published");
    expect(html(h(PublishBar, { version: 3, changes: 0 }))).toContain("v3 published");
    expect(html(h(PublishBar, { version: 3, changes: 2 }))).toContain("Draft · 2 changes");
  });
  it("keeps Publish off while a check blocks", async () => {
    await mount(
      h(PublishDialog, {
        version: 4,
        changes: [{ kind: "add", text: "Step “Mail the CFO”" }],
        checks: [{ level: "blocking", text: "The automation has no trigger." }],
        onPublish: vi.fn<(message: string) => void>(),
        onClose: vi.fn<() => void>(),
      }),
    );
    // The dialog is in a portal.
    const publish = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Publish v4"),
    );
    expect(publish?.disabled).toBe(true);
    expect(document.body.textContent).toContain("1 change since v3");
  });
});

describe("JsonView", () => {
  it("colours keys, strings, numbers and booleans", () => {
    const out = html(h(JsonView, { value: { a: "x", b: 2, c: true, d: null } }));
    expect(out).toContain('fg-json-k">&quot;a&quot;');
    expect(out).toContain('fg-json-s">&quot;x&quot;');
    expect(out).toContain('fg-json-n">2');
    expect(out).toContain('fg-json-b">true');
    expect(out).toContain('fg-json-z">null');
    expect(highlightJson('"k": "v"')).toHaveLength(4);
  });
});

describe("parts of the automation blocks", () => {
  it("StepCard: parts build any card, and the rest goes on the card", () => {
    const out = html(
      h(
        StepCard,
        { kind: "trigger", status: "error", className: "mine", "data-x": "1", id: "card" } as never,
        h(StepCardTrigger),
        h(StepCardMain, { icon: BoltIcon }, h(StepCardText, null, h(StepCardTitle, null, "Start"))),
        h(StepCardState),
        h(StepCardError, null, "503 from the relay"),
      ),
    );
    expect(out).toContain('data-slot="step-card"');
    expect(out).toContain("fg-step-trigger");
    expect(out).toContain("mine");
    expect(out).toContain('data-x="1"');
    expect(out).toContain('id="card"');
    expect(out).toContain("Trigger");
    expect(out).toContain("Failed");
    expect(out).toContain("503 from the relay");
    // The props form takes the rest too, and asChild.
    const short = html(h(StepCard, { title: "Post", icon: Message01Icon, "data-x": "2" } as never));
    expect(short).toContain('data-x="2"');
    const child = html(
      h(StepCard, { asChild: true, kind: "action" }, h("li", { className: "own" })),
    );
    expect(child).toContain("<li");
    expect(child).toContain("fg-step");
    expect(child).toContain("own");
  });

  it("StepList: one tab stop, Enter opens, parts and read-only", async () => {
    const onSelect = vi.fn<(id: string) => void>();
    const root = await mount(
      h(
        StepList,
        { defaultSteps: tree, onSelect, readOnly: true, "data-x": "1" } as never,
        h(StepListEmpty),
        h(StepListSteps),
      ),
    );
    expect(root.querySelector('[data-slot="step-list"]')?.getAttribute("data-x")).toBe("1");
    const cards = [...root.querySelectorAll<HTMLElement>("[data-collection-item]")];
    expect(cards.map((c) => c.getAttribute("data-collection-item"))).toEqual([
      "t",
      "if",
      "mail",
      "chat",
    ]);
    expect(cards.filter((c) => c.tabIndex === 0)).toHaveLength(1);
    // Buttons inside the cards are not tab stops of their own.
    expect(
      [...root.querySelectorAll<HTMLElement>(".fg-step-main")].every((b) => b.tabIndex === -1),
    ).toBe(true);
    expect(root.querySelector(".fg-steps-add")).toBeNull();
    expect(root.querySelector('[aria-label="Remove Post in Chat"]')).toBeNull();
    await act(async () => cards[0]!.focus());
    await key(cards[0]!, "Enter");
    expect(onSelect).toHaveBeenCalledWith("t");
    await key(cards[0]!, "ArrowDown");
    expect(document.activeElement).toBe(cards[1]);
  });

  it("StepList: shows the empty message through its part", () => {
    const out = html(h(StepList, { steps: [], empty: "Start with a trigger" }));
    expect(out).toContain("Start with a trigger");
  });

  it("RunList: parts, the Failed filter and rest on RunBars", async () => {
    const root = await mount(
      h(
        RunList,
        {
          filter: true,
          today: "2026-11-18",
          runs: [
            { id: "2", status: "error", at: "2026-11-18 08:00:00" },
            { id: "1", status: "success", at: "2026-11-18 07:00:00" },
          ],
        },
        h(RunListFilter),
        h(RunListDays),
      ),
    );
    expect(root.querySelectorAll(".fg-runs-row")).toHaveLength(2);
    const failed = [...root.querySelectorAll("button")].find((b) => b.textContent === "Failed")!;
    await click(failed);
    expect(root.querySelectorAll(".fg-runs-row")).toHaveLength(1);
    const bars = html(h(RunBars, { values: [1, 2], className: "x", "data-y": "1" } as never));
    expect(bars).toContain("fg-runbars x");
    expect(bars).toContain('data-y="1"');
  });

  it("ScheduleEditor: the parts alone, and the shorthand's rest", () => {
    const out = html(
      h(
        ScheduleEditor,
        { defaultValue: "0 8 * * 1-5", from: "2026-11-20T09:00", "data-x": "1" } as never,
        h(ScheduleEditorModes),
        h(ScheduleEditorSummary),
        h(ScheduleEditorNext),
      ),
    );
    expect(out).toContain("Weekdays at 08:00");
    expect(out).toContain("Mon 2026-11-23 08:00");
    expect(out).not.toContain("fg-sched-row");
    expect(out).toContain('data-x="1"');
  });

  it("StepPicker: the search and the list as parts", async () => {
    const onPick = vi.fn<(id: string) => void>();
    const root = await mount(
      h(
        StepPicker,
        {
          onPick,
          options: [
            { id: "mail", label: "Send mail", icon: Mail01Icon, group: "apps" },
            { id: "chat", label: "Post message", icon: Message01Icon, group: "apps" },
          ],
        },
        h(StepPickerSearch),
        h(StepPickerList),
      ),
    );
    expect(root.querySelector('[role="combobox"]')).not.toBeNull();
    expect(root.querySelector(".fg-spick-head")).toBeNull();
    expect(root.querySelectorAll('[role="option"]')).toHaveLength(2);
  });

  it("StepFields, StepSettings and StepInspector: parts", async () => {
    const fields = [
      { key: "to", label: "To", type: "text" as const },
      { key: "urgent", label: "Urgent", type: "boolean" as const },
    ];
    const one = html(
      h(
        StepFields,
        { fields, defaultValues: { to: "a@b.c" } },
        h(StepField, { field: fields[0]! }),
      ),
    );
    expect(one).toContain("a@b.c");
    expect(one).not.toContain("Urgent");
    const settings = html(h(StepSettings, null, h(StepSettingsOnError)));
    expect(settings).toContain("Stop the run");
    expect(settings).not.toContain("Retry on failure");
    const root = await mount(
      h(
        StepInspector,
        {
          icon: BoltIcon,
          title: "Send invoice",
          subtitle: "Mail · send()",
          fields,
          "data-x": "1",
        } as never,
        h(StepInspectorHeader),
        h(StepInspectorTabs),
      ),
    );
    expect(root.querySelector('[data-slot="step-inspector"]')?.getAttribute("data-x")).toBe("1");
    expect(root.textContent).toContain("Send invoice");
    expect(root.textContent).toContain("Parameters");
    expect(root.querySelector(".fg-insp-foot")).toBeNull();
  });

  it("PublishBar, ChangeList, PublishDialog and VersionHistory: parts", async () => {
    const bar = html(
      h(
        PublishBar,
        { version: 3, changes: 2, onPublish: vi.fn<() => void>() },
        h(PublishBarState),
        h(PublishBarPublish),
      ),
    );
    expect(bar).toContain("Draft · 2 changes");
    expect(bar).toContain("Publish");
    expect(bar).not.toContain('role="switch"');
    const list = html(h(ChangeList, null, h(ChangeListItem, { kind: "add" }, "A step")));
    expect(list).toContain("fg-changes-add");
    expect(list).toContain("A step");

    const onPublish = vi.fn<(message: string) => void>();
    await mount(
      h(
        PublishDialog,
        {
          version: 2,
          changes: [{ kind: "add", text: "Step X" }],
          onPublish,
          onClose: vi.fn<() => void>(),
        },
        h(
          PublishDialogContent,
          null,
          h(PublishDialogMessage),
          h(PublishDialogChanges),
          h(PublishDialogFooter),
        ),
      ),
    );
    expect(document.body.textContent).toContain("Publish v2");
    expect(document.body.textContent).toContain("1 change since v1");
    const go = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Publish v2"),
    )!;
    await click(go);
    expect(onPublish).toHaveBeenCalledWith("Step X");
  });

  it("VersionHistory: the list is one stop and its arrows choose", async () => {
    const onSelect = vi.fn<(v: number | "draft") => void>();
    const root = await mount(
      h(
        VersionHistory,
        {
          live: 2,
          onSelect,
          versions: [
            { version: 2, message: "Two", at: "2026-11-18 09:00", by: "Léa" },
            { version: 1, message: "One", at: "2026-11-17 09:00", by: "Léa" },
          ],
        },
        h(VersionHistoryList),
        h(VersionHistoryDetail),
      ),
    );
    const rows = [...root.querySelectorAll<HTMLElement>(".fg-versions-row")];
    expect(rows.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    expect(rows[0]!.getAttribute("aria-current")).toBe("true");
    await act(async () => rows[0]!.focus());
    await key(rows[0]!, "ArrowDown");
    expect(onSelect).toHaveBeenLastCalledWith(1);
    expect(root.textContent).toContain("v1 · One");
  });

  it("AutomationList: parts on the table, and the open on Enter", async () => {
    const a = {
      id: "a",
      name: "Welcome",
      trigger: { label: "Deal won", icon: BoltIcon },
      state: "active" as const,
    };
    const onOpen = vi.fn<(automation: { id: string }) => void>();
    const root = await mount(
      h(
        AutomationList,
        { onOpen, label: "Mine" },
        h(AutomationListHeader),
        h(AutomationListBody, null, h(AutomationListRow, { automation: a }, h(AutomationListName))),
      ),
    );
    expect(root.querySelector("table")?.getAttribute("aria-label")).toBe("Mine");
    expect(root.querySelectorAll("tbody td")).toHaveLength(1);
    const row = root.querySelector<HTMLElement>("tbody tr")!;
    expect(row.tabIndex).toBe(0);
    await key(row, "Enter");
    expect(onOpen).toHaveBeenCalledWith(a);
    const short = html(h(AutomationList, { automations: [a], className: "mine" }));
    expect(short).toContain("Welcome");
    expect(short).toContain("fg-autolist mine");
  });
});
