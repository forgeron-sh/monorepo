// The automations of a workspace, after the list of the Flows prototype: each one with what
// starts it, its state, its last run, the bars of its runs of the last days and its owner. A row
// opens the automation; the menu of a row is the caller's.
//
// Two ways to use it. With `automations` it draws the table. Without, it is the root of the parts,
// built on the Table parts, and the rows are yours:
//
//   <AutomationList onOpen={open} label="Automations">
//     <AutomationListHeader />
//     <AutomationListBody>
//       {automations.map((a) => <AutomationListRow key={a.id} automation={a} />)}
//     </AutomationListBody>
//   </AutomationList>

import type { IconDefinition } from "@forgeron/icons";
import {
  createContext,
  useContext,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Led } from "../led";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableRootProps,
} from "../table";
import { formatDuration, statusLook, type RunStatus } from "./automation-model";
import { RunBars } from "./automation-runs";

export interface AutomationSummary {
  id: string;
  name: string;
  /** Under the name, in mono: `Sales · 6 steps · v4`. */
  meta?: string;
  trigger: { label: string; icon: IconDefinition };
  /** `active` listens to its trigger; `paused` does not; `draft` was never published. */
  state: "active" | "paused" | "draft";
  lastRun?: { status: RunStatus; ago: string; durationMs?: number };
  /** Runs per day, oldest first, and failures among them. */
  runs?: ReadonlyArray<number>;
  errors?: ReadonlyArray<number>;
  owner?: string;
}

export type AutomationColumn = "trigger" | "state" | "last" | "runs" | "owner";

const ALL_COLUMNS: ReadonlyArray<AutomationColumn> = ["trigger", "state", "last", "runs", "owner"];

const STATE = {
  active: { tone: "success", text: "Active" },
  paused: { tone: "neutral", text: "Paused" },
  draft: { tone: "warning", text: "Draft" },
} as const;

/* ---------------------------------------------------------------- context */

interface AutomationListContext {
  onOpen: ((automation: AutomationSummary) => void) | undefined;
  renderActions: ((automation: AutomationSummary) => ReactNode) | undefined;
  columns: ReadonlyArray<AutomationColumn>;
  runsLabel: string;
  empty: ReactNode;
}

const Ctx = createContext<AutomationListContext | null>(null);

function useAutomationList(part: string): AutomationListContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside an <AutomationList>.`);
  return ctx;
}

const RowCtx = createContext<AutomationSummary | null>(null);

function useAutomation(part: string): AutomationSummary {
  const row = useContext(RowCtx);
  if (!row) throw new Error(`<${part}> goes inside an <AutomationListRow>.`);
  return row;
}

/* ---------------------------------------------------------------- root */

interface AutomationListShared {
  /** Opens the automation of a row, on a click and on Enter. */
  onOpen?: (automation: AutomationSummary) => void;
  /** The end of each row: a menu, a switch. */
  renderActions?: (automation: AutomationSummary) => ReactNode;
  /** The columns after the name, in order; fewer for a narrow place. */
  columns?: ReadonlyArray<AutomationColumn>;
  /** The header of the runs column. */
  runsLabel?: string;
  empty?: ReactNode;
  label?: string;
  className?: string;
}

export interface AutomationListProps
  extends
    AutomationListShared,
    Omit<ComponentProps<"table">, "className" | "children" | "onChange"> {
  automations: ReadonlyArray<AutomationSummary>;
}

/** The parts form: `automations` stays undefined. */
export interface AutomationListRootProps
  extends AutomationListShared, Omit<ComponentProps<"table">, "className" | "onChange"> {
  automations?: undefined;
  children?: ReactNode;
}

/** Automations with trigger, state, last run, runs of the last days and owner. */
export function AutomationList(props: AutomationListProps | AutomationListRootProps) {
  const {
    automations,
    onOpen,
    renderActions,
    columns = ALL_COLUMNS,
    runsLabel = "Runs · 14 d",
    empty = "No automation yet",
    label = "Automations",
    className,
    ...rest
  } = props;
  const { children, ...tableProps } = rest as typeof rest & { children?: ReactNode };
  const ctx: AutomationListContext = { onOpen, renderActions, columns, runsLabel, empty };
  return (
    <Ctx.Provider value={ctx}>
      <Table
        data-slot="automation-list"
        aria-label={label}
        {...(tableProps as TableRootProps)}
        className={cx("fg-autolist", className)}
      >
        {automations === undefined ? (
          children
        ) : (
          <>
            <AutomationListHeader />
            <AutomationListBody>
              {automations.length === 0 ? <AutomationListEmpty /> : null}
              {automations.map((a) => (
                <AutomationListRow key={a.id} automation={a} />
              ))}
            </AutomationListBody>
          </>
        )}
      </Table>
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

const HEADS: Record<"name" | AutomationColumn, string> = {
  name: "Automation",
  trigger: "Trigger",
  state: "State",
  last: "Last run",
  runs: "Runs",
  owner: "Owner",
};

/** The header row: the name, the columns of the root, and the actions. */
export function AutomationListHeader({ className, children, ...rest }: ComponentProps<"thead">) {
  const { columns, runsLabel, renderActions } = useAutomationList("AutomationListHeader");
  return (
    <TableHeader data-slot="automation-list-header" {...rest} className={className}>
      {children ?? (
        <TableRow>
          <TableHead scope="col">{HEADS.name}</TableHead>
          {columns.map((c) => (
            <TableHead key={c} scope="col">
              {c === "runs" ? runsLabel : HEADS[c]}
            </TableHead>
          ))}
          {renderActions ? (
            <TableHead scope="col" className="fg-end">
              <span className="fg-sr">Actions</span>
            </TableHead>
          ) : null}
        </TableRow>
      )}
    </TableHeader>
  );
}

/** The rows. */
export function AutomationListBody(props: ComponentProps<"tbody">) {
  return <TableBody data-slot="automation-list-body" {...props} />;
}

export interface AutomationListRowProps extends Omit<ComponentProps<"tr">, "children"> {
  automation: AutomationSummary;
  /** The cells; default the name, the root's columns and the actions. */
  children?: ReactNode;
}

/** One automation. It opens on a click and on Enter or Space when the root has `onOpen`. */
export function AutomationListRow({
  automation,
  className,
  children,
  onClick,
  onKeyDown,
  ...rest
}: AutomationListRowProps) {
  const { onOpen, columns, renderActions } = useAutomationList("AutomationListRow");
  const open = onOpen
    ? {
        tabIndex: 0,
        onClick: (event: MouseEvent<HTMLTableRowElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) onOpen(automation);
        },
        onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(automation);
          }
        },
      }
    : { onClick, onKeyDown };
  return (
    <RowCtx.Provider value={automation}>
      <TableRow
        data-slot="automation-list-row"
        {...rest}
        {...open}
        className={cx(onOpen && "fg-table-click", className)}
      >
        {children ?? (
          <>
            <AutomationListName />
            {columns.map((c) => {
              switch (c) {
                case "trigger":
                  return <AutomationListTrigger key={c} />;
                case "state":
                  return <AutomationListState key={c} />;
                case "last":
                  return <AutomationListLast key={c} />;
                case "runs":
                  return <AutomationListRuns key={c} />;
                case "owner":
                  return <AutomationListOwner key={c} />;
              }
            })}
            {renderActions ? <AutomationListActions /> : null}
          </>
        )}
      </TableRow>
    </RowCtx.Provider>
  );
}

type CellProps = Omit<ComponentProps<"td">, "className"> & { className?: string };

/** The icon of its trigger, its name and, under it, its meta line. */
export function AutomationListName({ className, children, ...rest }: CellProps) {
  const a = useAutomation("AutomationListName");
  return (
    <TableCell data-slot="automation-list-name" {...rest} className={className}>
      {children ?? (
        <span className="fg-autolist-name">
          <span className="fg-step-tile">
            <Icon icon={a.trigger.icon} size={12} />
          </span>
          <span className="fg-autolist-text">
            <b>{a.name}</b>
            {a.meta ? <span className="fg-autolist-meta">{a.meta}</span> : null}
          </span>
        </span>
      )}
    </TableCell>
  );
}

/** What starts it. */
export function AutomationListTrigger({ className, children, ...rest }: CellProps) {
  const a = useAutomation("AutomationListTrigger");
  return (
    <TableCell data-slot="automation-list-trigger" {...rest} className={className}>
      {children ?? <span className="fg-autolist-trigger">{a.trigger.label}</span>}
    </TableCell>
  );
}

/** Active, paused or draft. */
export function AutomationListState({ className, children, ...rest }: CellProps) {
  const a = useAutomation("AutomationListState");
  return (
    <TableCell data-slot="automation-list-state" {...rest} className={className}>
      {children ?? (
        <Badge tone={STATE[a.state].tone} dot>
          {STATE[a.state].text}
        </Badge>
      )}
    </TableCell>
  );
}

/** Its last run: state, how long ago, how long it took. */
export function AutomationListLast({ className, children, ...rest }: CellProps) {
  const a = useAutomation("AutomationListLast");
  return (
    <TableCell data-slot="automation-list-last" {...rest} className={className}>
      {children ??
        (a.lastRun ? (
          <span className="fg-autolist-last">
            <Led
              tone={statusLook(a.lastRun.status).tone}
              label={statusLook(a.lastRun.status).word}
            />
            <span>{a.lastRun.ago}</span>
            {a.lastRun.durationMs !== undefined ? (
              <span className="fg-autolist-dur">{formatDuration(a.lastRun.durationMs)}</span>
            ) : null}
          </span>
        ) : (
          <span className="fg-autolist-never">Never</span>
        ))}
    </TableCell>
  );
}

/** The bars of its runs of the last days. */
export function AutomationListRuns({ className, children, ...rest }: CellProps) {
  const a = useAutomation("AutomationListRuns");
  return (
    <TableCell data-slot="automation-list-runs" {...rest} className={className}>
      {children ??
        (a.runs ? (
          <RunBars
            values={a.runs}
            {...(a.errors ? { errors: a.errors } : {})}
            label={`Runs of ${a.name}`}
          />
        ) : null)}
    </TableCell>
  );
}

/** Its owner, as an avatar. */
export function AutomationListOwner({ className, children, ...rest }: CellProps) {
  const a = useAutomation("AutomationListOwner");
  return (
    <TableCell data-slot="automation-list-owner" {...rest} className={className}>
      {children ??
        (a.owner ? (
          <span className="fg-autolist-owner">
            <Avatar name={a.owner} size={20} />
            <span className="fg-sr">{a.owner}</span>
          </span>
        ) : null)}
    </TableCell>
  );
}

/** The end of the row: what the root's `renderActions` gives, or your own. A click here does not open the row. */
export function AutomationListActions({ className, children, ...rest }: CellProps) {
  const a = useAutomation("AutomationListActions");
  const { renderActions } = useAutomationList("AutomationListActions");
  return (
    <TableCell data-slot="automation-list-actions" {...rest} className={cx("fg-end", className)}>
      {/* The row opens on a click and on Enter: what happens in its actions stays there. */}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <span
        className="fg-autolist-actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {children ?? renderActions?.(a)}
      </span>
    </TableCell>
  );
}

/** The row of an empty list: `No automation yet`. */
export function AutomationListEmpty({ className, children, ...rest }: CellProps) {
  const { columns, renderActions, empty } = useAutomationList("AutomationListEmpty");
  return (
    <TableRow>
      <TableCell
        data-slot="automation-list-empty"
        colSpan={columns.length + 1 + (renderActions ? 1 : 0)}
        {...rest}
        className={cx("fg-table-empty", className)}
      >
        {children ?? empty}
      </TableCell>
    </TableRow>
  );
}
