// A chart of people or units: cards in rows by depth, each one centred over the cards that report
// to it, joined by square pixel connectors. Branches fold, a card is picked, the arrows walk the
// chart, and an open role shows as a dashed card. It scrolls; there is no pan or zoom.
//
// With props it is the whole chart; with children it is the root of the parts:
//
//   <OrgChart roots={team} selected={id} onSelectedChange={setId}>
//     <OrgChartCanvas>
//       <OrgChartLinks />
//       <OrgChartCards />
//     </OrgChartCanvas>
//   </OrgChart>

import { UserIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import {
  structureFind,
  structureOrgLayout,
  structureOrgNavigate,
  structureToggle,
  type StructureOrgBox,
} from "./structure-model";

export interface OrgPerson {
  id: string;
  name: string;
  /** Their role: "Head of Sales". */
  title?: string;
  /** A line more on the detailed card: a team, a place. */
  meta?: string;
  /** A picture; the initials come from the name. */
  avatar?: string;
  /** An open role: a dashed card that says "Vacant". `name` is then the label of the post. */
  vacant?: boolean;
  /** Anything small at the end of the detailed card: a status, a tag. */
  badge?: ReactNode;
  children?: ReadonlyArray<OrgPerson> | undefined;
}

export interface OrgCardState {
  variant: "compact" | "detailed";
  selected: boolean;
  folded: boolean;
  /** People under them, at any depth. */
  reports: number;
}

export interface OrgChartProps {
  /** The top of the chart: one person, or several trees side by side. */
  roots: ReadonlyArray<OrgPerson>;
  /** `compact`: avatar, name and role on a line. `detailed`: more room, the team, the count. */
  variant?: "compact" | "detailed";
  /** The cards whose reports are folded away. */
  collapsed?: ReadonlyArray<string>;
  defaultCollapsed?: ReadonlyArray<string>;
  onCollapsedChange?: (ids: string[]) => void;
  /** The picked card. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /** Enter or a double click on a card: open the person. */
  onActivate?: (id: string) => void;
  /** Your own card; the frame, the selection and the fold stay. */
  renderCard?: (person: OrgPerson, state: OrgCardState) => ReactNode;
  /** Names the chart for assistive technology. */
  label?: string;
  /** The parts. Without them the chart draws its canvas: the links, then the cards. */
  children?: ReactNode;
  className?: string;
}

const SIZES = {
  compact: { width: 184, height: 48, gapX: 16, gapY: 32, padding: 16 },
  detailed: { width: 232, height: 96, gapX: 20, gapY: 40, padding: 16 },
} as const;

const countReports = (p: OrgPerson): number =>
  (p.children ?? []).reduce((n, c) => n + 1 + countReports(c), 0);

interface OrgContext {
  roots: ReadonlyArray<OrgPerson>;
  variant: "compact" | "detailed";
  size: (typeof SIZES)[keyof typeof SIZES];
  layout: ReturnType<typeof structureOrgLayout>;
  at: ReadonlyMap<string, StructureOrgBox>;
  place: ReadonlyMap<string, { pos: number; size: number }>;
  current: string | null;
  /** The card that is the one tab stop. */
  stop: string | undefined;
  label: string;
  canvas: RefObject<HTMLDivElement | null>;
  renderCard: ((person: OrgPerson, state: OrgCardState) => ReactNode) | undefined;
  focusCard: (id: string) => void;
  setFocusId: (id: string) => void;
  fold: (id: string, on: boolean) => void;
  select: (id: string | null) => void;
  activate: ((id: string) => void) | undefined;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

const Ctx = createContext<OrgContext | null>(null);

/** The state of the enclosing `OrgChart`: the layout, the picked card, the folds. */
export function useOrgChart(): OrgContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("OrgChart parts go inside an <OrgChart>.");
  return ctx;
}

/** The drawing board: the frame of the cards, `role="tree"`, with the keyboard walk. */
export function OrgChartCanvas({
  className,
  style,
  children,
  ...rest
}: Omit<ComponentProps<"div">, "ref">) {
  const { canvas, label, layout, onKeyDown } = useOrgChart();
  return (
    <div
      ref={canvas}
      role="tree"
      aria-label={label}
      data-slot="org-chart-canvas"
      {...rest}
      className={cx("fg-org-canvas", className)}
      style={{ width: layout.width, height: layout.height, ...style }}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        if (!e.defaultPrevented) onKeyDown(e);
      }}
    >
      {children ?? (
        <>
          <OrgChartLinks />
          <OrgChartCards />
        </>
      )}
    </div>
  );
}

/** The square pixel connectors between the cards. */
export function OrgChartLinks({ className, ...rest }: Omit<ComponentProps<"svg">, "ref">) {
  const { layout, roots } = useOrgChart();
  return (
    <svg
      data-slot="org-chart-links"
      {...rest}
      className={cx("fg-org-links", className)}
      width={layout.width}
      height={layout.height}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      {layout.links.map((link) => {
        const child = structureFind(roots, link.to);
        const d = link.points
          .map(([x, y], i) => `${i ? "L" : "M"}${Math.round(x) + 0.5} ${Math.round(y) + 0.5}`)
          .join("");
        const [ex, ey] = link.points[3]!;
        return (
          <g key={link.to} className={cx(child?.vacant && "fg-org-link-vacant")}>
            <path d={d} className="fg-org-link" />
            <rect
              x={Math.round(ex) - 1}
              y={Math.round(ey) - 3}
              width={3}
              height={3}
              className="fg-org-knot"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** One `OrgChartCard` for each card shown. */
export function OrgChartCards() {
  const { layout } = useOrgChart();
  return layout.boxes.map((box) => <OrgChartCard key={box.id} id={box.id} />);
}

export interface OrgChartCardProps extends Omit<ComponentProps<"div">, "id" | "ref"> {
  /** The id of the person. */
  id: string;
}

/** One card, placed on the canvas: its body (or `renderCard`, or children) and its fold button. */
export function OrgChartCard({ id, className, style, children, ...rest }: OrgChartCardProps) {
  const chart = useOrgChart();
  const box = chart.at.get(id);
  const person = structureFind(chart.roots, id);
  if (!box || !person) return null;
  const on = chart.current === id;
  const info = chart.place.get(id)!;
  const reports = countReports(person);
  const state: OrgCardState = {
    variant: chart.variant,
    selected: on,
    folded: box.folded,
    reports,
  };
  return (
    <div
      role="treeitem"
      data-org-id={id}
      data-slot="org-chart-card"
      aria-level={box.level}
      aria-setsize={info.size}
      aria-posinset={info.pos}
      aria-selected={on}
      {...(box.branch ? { "aria-expanded": !box.folded } : {})}
      tabIndex={id === chart.stop ? 0 : -1}
      {...rest}
      className={cx(
        "fg-org-card",
        on && "fg-org-card-current",
        person.vacant && "fg-org-card-vacant",
        className,
      )}
      style={{
        left: box.x,
        top: box.y,
        width: chart.size.width,
        height: chart.size.height,
        ...style,
      }}
      onFocus={(e) => {
        rest.onFocus?.(e);
        if (e.target === e.currentTarget) chart.setFocusId(id);
      }}
      onClick={(e) => {
        rest.onClick?.(e);
        chart.focusCard(id);
        chart.select(id);
      }}
      onDoubleClick={(e) => {
        rest.onDoubleClick?.(e);
        chart.activate?.(id);
      }}
    >
      {children ??
        (chart.renderCard ? (
          chart.renderCard(person, state)
        ) : (
          <OrgCardBody person={person} state={state} />
        ))}
      {box.branch ? <OrgChartFold id={id} /> : null}
    </div>
  );
}

/** The button that hides or shows the people under a card ("+3" when folded). */
export function OrgChartFold({
  id,
  className,
  ...rest
}: Omit<ComponentProps<"button">, "id" | "ref"> & { id: string }) {
  const { at, roots, fold } = useOrgChart();
  const box = at.get(id);
  const person = structureFind(roots, id);
  if (!box || !person) return null;
  const reports = countReports(person);
  return (
    <button
      type="button"
      tabIndex={-1}
      data-slot="org-chart-fold"
      aria-label={`${box.folded ? "Show" : "Hide"} the ${reports} under ${person.name}`}
      aria-expanded={!box.folded}
      {...rest}
      className={cx("fg-org-fold", className)}
      onClick={(e) => {
        rest.onClick?.(e);
        e.stopPropagation();
        fold(id, !box.folded);
      }}
    >
      {box.folded ? `+${reports}` : "−"}
    </button>
  );
}

/** The cards of a hierarchy joined by connectors, with folds, selection and keyboard walking. */
export function OrgChart({
  roots,
  variant = "compact",
  collapsed,
  defaultCollapsed = [],
  onCollapsedChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onActivate,
  renderCard,
  label = "Organisation chart",
  children,
  className,
  ...rest
}: OrgChartProps & Omit<ComponentProps<"div">, keyof OrgChartProps | "ref">) {
  const [folded, setFolded] = useControllableState<ReadonlyArray<string>>({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: (ids) => onCollapsedChange?.([...ids]),
  });
  const [current, select] = useControllableState<string | null>({
    value: selected,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  });
  const [focusId, setFocusId] = useState<string | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // A chart wider than its frame opens on its top card, not on the left edge.
  useEffect(() => {
    const el = scroller.current;
    const top = canvas.current?.querySelector<HTMLElement>("[data-org-id]");
    if (!el || !top) return;
    el.scrollLeft = top.offsetLeft + top.offsetWidth / 2 - el.clientWidth / 2;
    // Once, on the first drawing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const size = SIZES[variant];
  const closed = new Set(folded);
  const layout = structureOrgLayout(roots, closed, size);
  const at = new Map(layout.boxes.map((b) => [b.id, b]));

  // Position among siblings, for assistive technology.
  const place = new Map<string, { pos: number; size: number }>();
  const mark = (list: ReadonlyArray<OrgPerson>) => {
    list.forEach((p, i) => {
      if (!at.has(p.id)) return;
      place.set(p.id, { pos: i + 1, size: list.length });
      if (!closed.has(p.id) && p.children) mark(p.children);
    });
  };
  mark(roots);

  const stop =
    (focusId && at.has(focusId) && focusId) ||
    (current && at.has(current) && current) ||
    layout.boxes[0]?.id;

  const focusCard = (id: string) => {
    setFocusId(id);
    const el = Array.from(
      canvas.current?.querySelectorAll<HTMLElement>("[data-org-id]") ?? [],
    ).find((e) => e.dataset.orgId === id);
    el?.focus();
    el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };

  const fold = (id: string, on: boolean) => setFolded(structureToggle(folded, id, on));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-org-id]");
    if (!el || (event.target as HTMLElement).tagName === "BUTTON") return;
    const id = el.dataset.orgId!;
    const box = at.get(id) as StructureOrgBox;
    switch (event.key) {
      case "ArrowDown":
        if (box.folded) fold(id, false);
        else {
          const next = structureOrgNavigate(layout.boxes, id, "ArrowDown");
          if (next) focusCard(next);
        }
        break;
      case "ArrowUp":
      case "ArrowLeft":
      case "ArrowRight":
      case "Home":
      case "End": {
        const next = structureOrgNavigate(layout.boxes, id, event.key);
        if (next) focusCard(next);
        break;
      }
      case "+":
      case "=":
        if (box.branch) fold(id, false);
        break;
      case "-":
        if (box.branch) fold(id, true);
        break;
      case "Enter":
        select(id);
        onActivate?.(id);
        break;
      case " ":
        select(id);
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const ctx: OrgContext = {
    roots,
    variant,
    size,
    layout,
    at,
    place,
    current,
    stop,
    label,
    canvas,
    renderCard,
    focusCard,
    setFocusId,
    fold,
    select,
    activate: onActivate,
    onKeyDown,
  };

  return (
    <Ctx.Provider value={ctx}>
      <div
        ref={scroller}
        data-slot="org-chart"
        {...rest}
        className={cx("fg-org", `fg-org-${variant}`, className)}
      >
        {children ?? <OrgChartCanvas />}
      </div>
    </Ctx.Provider>
  );
}

/** The inside of a card, for your own `renderCard` to wrap. */
export function OrgCardBody({ person, state }: { person: OrgPerson; state: OrgCardState }) {
  const detailed = state.variant === "detailed";
  return (
    <>
      {person.vacant ? (
        <span className="fg-org-gap" aria-hidden="true">
          <Icon icon={UserIcon} size={12} variant="mono" />
        </span>
      ) : (
        <Avatar
          name={person.name}
          size={detailed ? 32 : 24}
          {...(person.avatar ? { src: person.avatar } : {})}
        />
      )}
      <span className="fg-org-text">
        <b className="fg-org-name">{person.vacant ? (person.title ?? person.name) : person.name}</b>
        <span className="fg-org-role">{person.vacant ? "Vacant" : person.title}</span>
        {detailed && !person.vacant && person.meta ? (
          <span className="fg-org-meta">{person.meta}</span>
        ) : null}
        {detailed && state.reports > 0 ? (
          <span className="fg-org-meta">{state.reports} under them</span>
        ) : null}
      </span>
      {detailed && person.badge ? <span className="fg-org-badge">{person.badge}</span> : null}
    </>
  );
}
