// The reference list view: every piece of a Tasks screen put together, the way an app should.
// One hook holds the state (useListView), one list declares the actions (useActions), and the
// parts only display it. Add a layout by adding an entry to LAYOUTS and a renderer to RENDER.
import {
  Delete02Icon,
  FilterIcon,
  Loading03Icon,
  PlusSignIcon,
  SlidersHorizontalIcon,
  UserIcon,
} from "@forgeron/icons";
import {
  Button,
  buildMenu,
  CalendarView,
  CommandPalette,
  DEFAULT_LAYOUTS,
  DisplayLayouts,
  DisplayMenu,
  DisplayProperties,
  DisplayReset,
  DisplaySection,
  DisplaySelect,
  DisplayToggle,
  DisplayWhen,
  EmptyState,
  FilterBar,
  FilterMenu,
  Icon,
  IssueBoard,
  IssueList,
  LayoutSwitch,
  MORE_LAYOUTS,
  STATUS_NAMES,
  StatusGlyph,
  Timeline,
  ViewHeader,
  useActions,
  useDisclosure,
  useListView,
  type DisplayLayout,
  type DisplayOptions,
  type FilterField,
  type IssueItem,
  type IssueProperty,
  type StatusKind,
  type TimelineZoom,
  type ViewSpec,
} from "@forgeron/ui";
import { useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ data */

const TODAY = "2026-11-18";
const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "np", name: "Nadia Petit" },
];
const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "ops", label: "Warehouse", color: "var(--warning)" },
];
/** An issue, plus the day work started: the timeline draws a bar from it to the due date. */
type Issue = IssueItem & { start?: string };

const issues: Issue[] = [
  {
    id: "OPS-40",
    start: "2026-11-10",
    title: "Supplier invoices arrive twice",
    status: "progress",
    priority: 1,
    labels: ["bug"],
    assignee: "hb",
    due: "2026-11-20",
  },
  {
    id: "OPS-41",
    start: "2026-11-17",
    title: "Carrier rates: import the new grid",
    status: "todo",
    priority: 2,
    assignee: "cr",
    due: "2026-11-26",
  },
  {
    id: "OPS-38",
    start: "2026-11-12",
    title: "Fire exit signage audit",
    status: "review",
    priority: 3,
    labels: ["ops"],
    assignee: "np",
    due: "2026-11-19",
  },
  {
    id: "OPS-35",
    start: "2026-11-24",
    title: "Quarterly safety walk",
    status: "todo",
    priority: 4,
    labels: ["ops"],
    due: "2026-12-02",
  },
  {
    id: "OPS-33",
    title: "Label printer jams on 4x6",
    status: "backlog",
    priority: 3,
    labels: ["bug"],
  },
  {
    id: "OPS-30",
    start: "2026-11-03",
    title: "Archive last year's delivery notes",
    status: "done",
    priority: 0,
    assignee: "cr",
    due: "2026-11-12",
  },
];

/* ------------------------------------------------------------------ the view, declared */

const STATUSES: StatusKind[] = ["backlog", "todo", "progress", "review", "done"];

const LAYOUTS: DisplayLayout[] = [
  { ...DEFAULT_LAYOUTS[0]!, kbd: "shift+l" },
  { ...DEFAULT_LAYOUTS[1]!, kbd: "shift+b" },
  { ...MORE_LAYOUTS.timeline, kbd: "shift+t" },
  { ...MORE_LAYOUTS.calendar, kbd: "shift+c" },
];

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: Loading03Icon,
    options: STATUSES.map((s) => ({
      value: s,
      label: STATUS_NAMES[s],
      glyph: <StatusGlyph status={s} />,
    })),
  },
  {
    id: "assignee",
    label: "Assignee",
    icon: UserIcon,
    options: [
      { value: "_", label: "No assignee" },
      ...people.map((p) => ({ value: p.id, label: p.name })),
    ],
  },
];

const spec: ViewSpec<Issue> = {
  read: (issue, field) =>
    field === "status" ? issue.status : field === "assignee" ? (issue.assignee ?? null) : null,
  groupings: {
    status: { key: (i) => i.status, order: STATUSES, name: (k) => STATUS_NAMES[k as StatusKind] },
    assignee: {
      key: (i) => i.assignee ?? "_",
      name: (k) => people.find((p) => p.id === k)?.name ?? "No assignee",
    },
  },
  orderings: {
    priority: (a, b) => (a.priority || 9) - (b.priority || 9),
    due: (a, b) => (a.due ?? "9").localeCompare(b.due ?? "9"),
  },
};

const DEFAULTS: DisplayOptions = {
  layout: "list",
  grouping: "status",
  ordering: "priority",
  toggles: { showEmptyGroups: false },
  properties: ["id", "priority", "labels", "due", "assignee"],
  options: { zoom: "weeks" },
};

/* ------------------------------------------------------------------ the screen */

export default function ListViewReference() {
  // The records live in state, so a date moved on the timeline or the calendar sticks.
  const [items, setItems] = useState(issues);
  const view = useListView(items, spec, { defaultDisplay: DEFAULTS });
  const patch = (id: string, change: Partial<Issue>) =>
    setItems((all) => all.map((i) => (i.id === id ? { ...i, ...change } : i)));
  const filter = useDisclosure();
  const display = useDisclosure();
  const palette = useDisclosure();
  const { display: d } = view;

  // Every action once: in the palette (⌘K), and on its own key.
  const actions = useActions([
    { id: "new", label: "New issue", icon: PlusSignIcon, shortcut: "c", run: () => {} },
    { id: "filter", label: "Filter…", icon: FilterIcon, shortcut: "f", run: filter.onOpen },
    {
      id: "display",
      label: "Display options…",
      icon: SlidersHorizontalIcon,
      shortcut: "v",
      run: display.onOpen,
    },
    { id: "palette", label: "Command palette", shortcut: "mod+k", run: palette.onOpen },
    {
      id: "layout",
      label: "Layout",
      group: "View",
      actions: LAYOUTS.map((l) => ({
        id: `layout:${l.value}`,
        label: l.label,
        ...(l.icon ? { icon: l.icon } : {}),
        ...(l.kbd ? { shortcut: l.kbd } : {}),
        checked: d.layout === l.value,
        run: () => view.setLayout(l.value),
      })),
    },
  ]);

  // The menu of one row (right click or ⋯), built from the same Action shape as the screen's.
  const rowMenu = (issue: IssueItem) =>
    buildMenu([
      {
        id: "status",
        label: "Status",
        icon: Loading03Icon,
        actions: STATUSES.map((s) => ({
          id: `status:${s}`,
          label: STATUS_NAMES[s],
          glyph: <StatusGlyph status={s} />,
          checked: issue.status === s,
        })),
      },
      { id: "assign-me", label: "Assign to me", icon: UserIcon },
      { id: "delete", label: "Delete issue", icon: Delete02Icon, danger: true },
    ]);
  const onRowAction = (id: string, action: string) => {
    if (action.startsWith("status:")) patch(id, { status: action.slice(7) as StatusKind });
    else if (action === "assign-me") patch(id, { assignee: "cr" });
    else if (action === "delete") setItems((all) => all.filter((i) => i.id !== id));
  };

  const groups = view.groups.map((g) => ({
    key: g.key,
    name: g.name,
    ...(d.grouping === "status" ? { status: g.key as StatusKind } : {}),
    issues: g.records,
  }));
  const shared = {
    labels,
    people,
    today: TODAY,
    properties: d.properties as IssueProperty[],
    // Every property is a picker; a click on it never opens the issue. S P A L D open them by key.
    onIssueChange: patch,
    editors: { assignee: { people, me: "cr", noneLabel: "No assignee" } },
    rowMenu,
    onRowAction,
  };

  const RENDER: Record<string, () => ReactNode> = {
    list: () => (
      <IssueList groups={groups} showEmptyGroups={Boolean(d.toggles.showEmptyGroups)} {...shared} />
    ),
    board: () => <IssueBoard columns={groups} {...shared} />,
    timeline: () => (
      <Timeline
        groups={view.groups.map((g) => ({
          ...g,
          ...(d.grouping === "status"
            ? { glyph: <StatusGlyph status={g.key as StatusKind} /> }
            : {}),
        }))}
        today={TODAY}
        toolbar={false}
        zoom={(d.options?.zoom as TimelineZoom | undefined) ?? "weeks"}
        onZoomChange={(zoom) => view.setDisplay({ ...d, options: { ...d.options, zoom } })}
        onChange={(id, { start, end }) => {
          const change: Partial<Issue> = {};
          if (start) change.start = start;
          if (end) change.due = end;
          patch(id, change);
        }}
      />
    ),
    calendar: () => (
      <CalendarView
        records={view.records}
        today={TODAY}
        onChange={(id, due) => patch(id, { due })}
      />
    ),
  };

  return (
    <div style={{ width: "100%", border: "1px solid var(--line)" }}>
      <ViewHeader
        breadcrumb={[{ label: "Operations", href: "#ops" }, { label: "Issues" }]}
        switcher={<LayoutSwitch layouts={LAYOUTS} value={d.layout} onChange={view.setLayout} />}
        filter={
          <FilterMenu
            fields={fields}
            value={view.filters}
            onChange={view.setFilters}
            {...filter.props}
          />
        }
        display={
          <DisplayMenu
            value={d}
            onChange={view.setDisplay}
            defaultValue={DEFAULTS}
            {...display.props}
          >
            <DisplayLayouts layouts={LAYOUTS} />
            <DisplaySelect
              name="grouping"
              label="Grouping"
              options={[
                { value: "status", label: "Status" },
                { value: "assignee", label: "Assignee" },
                { value: "none", label: "No grouping" },
              ]}
            />
            <DisplaySelect
              name="ordering"
              label="Ordering"
              options={[
                { value: "priority", label: "Priority" },
                { value: "due", label: "Due date" },
              ]}
            />
            <DisplayWhen layout="timeline">
              <DisplaySelect
                name="zoom"
                label="Zoom"
                options={[
                  { value: "weeks", label: "Weeks" },
                  { value: "months", label: "Months" },
                  { value: "quarters", label: "Quarters" },
                ]}
              />
            </DisplayWhen>
            <DisplayWhen layout="list">
              <DisplaySection>
                <DisplayToggle id="showEmptyGroups" label="Show empty groups" />
              </DisplaySection>
            </DisplayWhen>
            <DisplayWhen layout={["list", "board"]}>
              <DisplayProperties
                properties={[
                  { id: "id", label: "ID" },
                  { id: "priority", label: "Priority" },
                  { id: "labels", label: "Labels" },
                  { id: "due", label: "Due date" },
                  { id: "assignee", label: "Assignee" },
                ]}
              />
            </DisplayWhen>
            <DisplayReset />
          </DisplayMenu>
        }
        action={
          <Button variant="primary" size="sm" kbd="C">
            <Icon icon={PlusSignIcon} size={12} variant="mono" />
            New issue
          </Button>
        }
      />
      <FilterBar fields={fields} value={view.filters} onChange={view.setFilters} />
      {view.records.length === 0 ? (
        <EmptyState variant="hatch" title="No issues match these filters" />
      ) : (
        RENDER[d.layout]?.()
      )}
      <CommandPalette groups={actions.commands} onSelect={actions.run} {...palette.props} />
    </div>
  );
}
