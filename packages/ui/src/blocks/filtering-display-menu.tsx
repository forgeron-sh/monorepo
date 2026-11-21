// The "Display" popover of a view: how the records are laid out (list, board, or any layout the
// app adds: timeline, calendar…), grouped and ordered, a few switches, and which properties each
// record shows. After the Tasks prototype.
//
// Two ways to use it. With props (`groupings`, `orderings`, `toggles`, `properties`) it renders
// the usual menu. With children it is a frame, and the parts below build any menu:
//
//   <DisplayMenu value={display} onChange={setDisplay} defaultValue={DEFAULTS}>
//     <DisplayLayouts layouts={[...DEFAULT_LAYOUTS, timeline]} />
//     <DisplaySelect name="grouping" label="Grouping" options={groupings} />
//     <DisplayWhen layout="timeline">
//       <DisplaySelect name="zoom" label="Zoom" options={zooms} />
//     </DisplayWhen>
//     <DisplaySection><DisplayToggle id="subIssues" label="Show sub-issues" /></DisplaySection>
//     <DisplayProperties properties={properties} />
//     <DisplayReset />
//   </DisplayMenu>

import type { IconDefinition } from "@forgeron/icons";
import {
  Calendar03Icon,
  ChartGanttIcon,
  GridViewIcon,
  ListViewIcon,
  SlidersHorizontalIcon,
} from "@forgeron/icons";
import { createContext, useContext, useId, type ReactNode } from "react";
import { Segmented, Switch } from "../controls";
import { cx } from "../cx";
import { formatShortcut } from "../hooks/use-shortcuts";
import { useDisclosure } from "../hooks/use-disclosure";
import { Icon } from "../icon";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { SelectMenu, type SelectMenuOption } from "../overlays";
import { Tooltip } from "../tooltip";

export type { DisplayOptions } from "../filter-model";
import type { DisplayOptions } from "../filter-model";

/** One way to lay the records out. Add your own: `{ value: "timeline", label: "Timeline" }`. */
export interface DisplayLayout {
  value: string;
  label: string;
  icon?: IconDefinition;
  /** The shortcut that switches to it, shown in its tooltip, e.g. `"mod+1"`. Bind it with `useShortcuts`. */
  kbd?: string;
}

export interface DisplayChoice {
  id: string;
  label: string;
}

/** List and Board, with their icons. */
export const DEFAULT_LAYOUTS: ReadonlyArray<DisplayLayout> = [
  { value: "list", label: "List", icon: ListViewIcon },
  { value: "board", label: "Board", icon: GridViewIcon },
];

/** Layouts an app often adds after List and Board; render them yourself. */
export const MORE_LAYOUTS = {
  timeline: { value: "timeline", label: "Timeline", icon: ChartGanttIcon },
  calendar: { value: "calendar", label: "Calendar", icon: Calendar03Icon },
} as const satisfies Record<string, DisplayLayout>;

/** Whether two sets of options are the same, ignoring the order of the properties. */
export function sameDisplay(a: DisplayOptions, b: DisplayOptions): boolean {
  const opts = { ...a.options, ...b.options };
  return (
    a.layout === b.layout &&
    a.grouping === b.grouping &&
    a.ordering === b.ordering &&
    a.properties.length === b.properties.length &&
    a.properties.every((p) => b.properties.includes(p)) &&
    Object.keys({ ...a.toggles, ...b.toggles }).every(
      (k) => Boolean(a.toggles[k]) === Boolean(b.toggles[k]),
    ) &&
    Object.keys(opts).every((k) => a.options?.[k] === b.options?.[k])
  );
}

/* ---------------------------------------------------------------- context */

interface DisplayContext {
  value: DisplayOptions;
  patch: (next: Partial<DisplayOptions>) => void;
  reset?: () => void;
  changed: boolean;
}

const Ctx = createContext<DisplayContext | null>(null);

function useDisplay(part: string): DisplayContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <DisplayMenu>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The layouts, as a row of segments filling the width of the menu. */
export function DisplayLayouts({
  layouts = DEFAULT_LAYOUTS,
}: {
  layouts?: ReadonlyArray<DisplayLayout>;
}) {
  const { value, patch } = useDisplay("DisplayLayouts");
  if (layouts.length === 0) return null;
  return (
    <Segmented
      label="Layout"
      data-slot="display-layouts"
      className="fg-display-layout"
      value={value.layout}
      onChange={(layout) => patch({ layout })}
      options={layouts.map((l) => ({
        value: l.value,
        label: (
          <>
            {l.icon ? <Icon icon={l.icon} size={12} variant="mono" /> : null}
            {l.label}
          </>
        ),
      }))}
    />
  );
}

export interface DisplaySelectProps {
  /** `grouping`, `ordering`, or the name of any other choice, kept in `options`. */
  name: string;
  label: string;
  options: ReadonlyArray<SelectMenuOption>;
}

/** A row: its name on the left, a compact select on the right. */
export function DisplaySelect({ name, label, options }: DisplaySelectProps) {
  const { value, patch } = useDisplay("DisplaySelect");
  const top = name === "grouping" || name === "ordering";
  const current = top ? value[name] : (value.options?.[name] ?? options[0]?.value ?? "");
  return (
    <div data-slot="display-select" className="fg-display-row">
      <span>{label}</span>
      <SelectMenu
        label={label}
        size="sm"
        options={options}
        value={current}
        onChange={(next) => {
          if (!next) return;
          patch(top ? { [name]: next } : { options: { ...value.options, [name]: next } });
        }}
      />
    </div>
  );
}

/** A switch, on or off, kept in `toggles` under its id. */
export function DisplayToggle({ id, label }: DisplayChoice) {
  const { value, patch } = useDisplay("DisplayToggle");
  return (
    <Switch
      data-slot="display-toggle"
      className="fg-display-switch"
      label={label}
      checked={Boolean(value.toggles[id])}
      onChange={(event) => patch({ toggles: { ...value.toggles, [id]: event.target.checked } })}
    />
  );
}

/** The properties a record can show, as chips to press; they stay in the order given here. */
export function DisplayProperties({
  properties,
  label = "Display properties",
}: {
  properties: ReadonlyArray<DisplayChoice>;
  label?: string;
}) {
  const { value, patch } = useDisplay("DisplayProperties");
  const headingId = useId();
  const toggle = (id: string) =>
    patch({
      properties: value.properties.includes(id)
        ? value.properties.filter((p) => p !== id)
        : properties.map((p) => p.id).filter((p) => p === id || value.properties.includes(p)),
    });
  return (
    <div
      data-slot="display-properties"
      className="fg-display-section"
      role="group"
      aria-labelledby={headingId}
    >
      <span id={headingId} className="fg-display-heading">
        {label}
      </span>
      <div className="fg-display-props">
        {properties.map((p) => (
          <button
            key={p.id}
            type="button"
            data-slot="display-property"
            className="fg-display-prop"
            aria-pressed={value.properties.includes(p.id)}
            onClick={() => toggle(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A block under a line, with an optional heading: switches, the options of one layout. */
export function DisplaySection({ title, children }: { title?: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <div
      data-slot="display-section"
      className="fg-display-section"
      {...(title ? { role: "group", "aria-labelledby": headingId } : {})}
    >
      {title ? (
        <span id={headingId} className="fg-display-heading">
          {title}
        </span>
      ) : null}
      {children}
    </div>
  );
}

/** Shows its children only for some layouts: a timeline's zoom, a board's column options. */
export function DisplayWhen({
  layout,
  children,
}: {
  layout: string | ReadonlyArray<string>;
  children?: ReactNode;
}) {
  const { value } = useDisplay("DisplayWhen");
  const on = typeof layout === "string" ? value.layout === layout : layout.includes(value.layout);
  return on ? <>{children}</> : null;
}

/** "Reset to default", shown only when the options differ from the menu's `defaultValue`. */
export function DisplayReset({ label = "Reset to default" }: { label?: string }) {
  const { reset, changed } = useDisplay("DisplayReset");
  if (!reset || !changed) return null;
  return (
    <div data-slot="display-reset" className="fg-display-foot">
      <button type="button" className="fg-btn fg-btn-sm fg-btn-ghost" onClick={reset}>
        {label}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- the menu */

export interface DisplayMenuProps {
  value: DisplayOptions;
  onChange: (value: DisplayOptions) => void;
  /** The options to go back to: offers "Reset to default" when the value differs. */
  defaultValue?: DisplayOptions;
  /** The parts of the menu. Without them, the menu is built from the props below. */
  children?: ReactNode;
  /** The ways to group records: Status, Assignee, Project, No grouping. */
  groupings?: ReadonlyArray<SelectMenuOption>;
  /** The ways to order records: Priority, Due date, Created, Updated. */
  orderings?: ReadonlyArray<SelectMenuOption>;
  /** The switches: "Show sub-issues", "Show empty groups". */
  toggles?: ReadonlyArray<DisplayChoice>;
  /** The properties a record can show, in order: ID, Status, Priority, Labels. */
  properties?: ReadonlyArray<DisplayChoice>;
  /** List and Board by default; `[]` hides the switch. */
  layouts?: ReadonlyArray<DisplayLayout>;
  /** Opens and closes the menu from outside, e.g. from a shortcut. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The words of the button. */
  label?: string;
  className?: string;
}

/** The "Display" button and its popover. Every change applies at once. */
export function DisplayMenu({
  value,
  onChange,
  defaultValue,
  children,
  groupings = [],
  orderings = [],
  toggles = [],
  properties = [],
  layouts = DEFAULT_LAYOUTS,
  open: openProp,
  onOpenChange,
  label = "Display",
  className,
}: DisplayMenuProps) {
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const ctx: DisplayContext = {
    value,
    patch: (next) => onChange({ ...value, ...next }),
    changed: defaultValue !== undefined && !sameDisplay(value, defaultValue),
    ...(defaultValue ? { reset: () => onChange(defaultValue) } : {}),
  };
  const parts = children ?? (
    <>
      <DisplayLayouts layouts={layouts} />
      {groupings.length > 0 ? (
        <DisplaySelect name="grouping" label="Grouping" options={groupings} />
      ) : null}
      {orderings.length > 0 ? (
        <DisplaySelect name="ordering" label="Ordering" options={orderings} />
      ) : null}
      {toggles.length > 0 ? (
        <DisplaySection>
          {toggles.map((t) => (
            <DisplayToggle key={t.id} {...t} />
          ))}
        </DisplaySection>
      ) : null}
      {properties.length > 0 ? <DisplayProperties properties={properties} /> : null}
      <DisplayReset />
    </>
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-slot="display-menu-trigger"
        className={cx("fg-btn fg-btn-sm fg-display-trigger", className)}
      >
        <Icon icon={SlidersHorizontalIcon} size={12} variant="mono" />
        <span className="fg-display-trigger-text">{label}</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        data-slot="display-menu-content"
        className="fg-display"
        aria-label="Display options"
      >
        <Ctx.Provider value={ctx}>{parts}</Ctx.Provider>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------------------------------------------------------- layout switch */

export interface LayoutSwitchProps {
  layouts?: ReadonlyArray<DisplayLayout>;
  value: string;
  onChange: (layout: string) => void;
  className?: string;
}

/** The layouts as square icon buttons, for the header of a view; each names itself in a tooltip. */
export function LayoutSwitch({
  layouts = DEFAULT_LAYOUTS,
  value,
  onChange,
  className,
}: LayoutSwitchProps) {
  return (
    <div
      data-slot="layout-switch"
      role="group"
      aria-label="Layout"
      className={cx("fg-seg fg-seg-icons", className)}
    >
      {layouts.map((l) => (
        <Tooltip
          key={l.value}
          content={l.label}
          {...(l.kbd ? { kbd: formatShortcut(l.kbd).join("") } : {})}
        >
          <button
            type="button"
            className="fg-seg-item"
            aria-pressed={l.value === value}
            aria-label={l.label}
            onClick={() => onChange(l.value)}
          >
            {l.icon ? <Icon icon={l.icon} size={12} variant="mono" /> : l.label.slice(0, 1)}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
