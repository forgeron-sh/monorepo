// The automations of a workspace, after the list of the Flows prototype: each one with what
// starts it, its state, its last run, the bars of its runs of the last days and its owner. A row
// opens the automation; the menu of a row is the caller's.

import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Led } from "../led";
import { Table, type TableColumn } from "../table";
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

export interface AutomationListProps {
  automations: ReadonlyArray<AutomationSummary>;
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

const STATE = {
  active: { tone: "success", text: "Active" },
  paused: { tone: "neutral", text: "Paused" },
  draft: { tone: "warning", text: "Draft" },
} as const;

/** Automations with trigger, state, last run, runs of the last days and owner. */
export function AutomationList({
  automations,
  onOpen,
  renderActions,
  columns: shown = ["trigger", "state", "last", "runs", "owner"],
  runsLabel = "Runs · 14 d",
  empty = "No automation yet",
  label = "Automations",
  className,
}: AutomationListProps) {
  const all: TableColumn<AutomationSummary>[] = [
    {
      key: "name",
      header: "Automation",
      render: (a) => (
        <span className="fg-autolist-name">
          <span className="fg-step-tile">
            <Icon icon={a.trigger.icon} size={12} />
          </span>
          <span className="fg-autolist-text">
            <b>{a.name}</b>
            {a.meta ? <span className="fg-autolist-meta">{a.meta}</span> : null}
          </span>
        </span>
      ),
    },
    {
      key: "trigger",
      header: "Trigger",
      render: (a) => <span className="fg-autolist-trigger">{a.trigger.label}</span>,
    },
    {
      key: "state",
      header: "State",
      render: (a) => (
        <Badge tone={STATE[a.state].tone} dot>
          {STATE[a.state].text}
        </Badge>
      ),
    },
    {
      key: "last",
      header: "Last run",
      render: (a) =>
        a.lastRun ? (
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
        ),
    },
    {
      key: "runs",
      header: runsLabel,
      render: (a) =>
        a.runs ? (
          <RunBars
            values={a.runs}
            {...(a.errors ? { errors: a.errors } : {})}
            label={`Runs of ${a.name}`}
          />
        ) : null,
    },
    {
      key: "owner",
      header: "Owner",
      render: (a) =>
        a.owner ? (
          <span className="fg-autolist-owner">
            <Avatar name={a.owner} size={20} />
            <span className="fg-sr">{a.owner}</span>
          </span>
        ) : null,
    },
  ];
  const columns = [all[0]!, ...shown.flatMap((key) => all.filter((c) => c.key === key))];
  if (renderActions) {
    columns.push({
      key: "actions",
      header: <span className="fg-sr">Actions</span>,
      align: "end",
      // The row opens on a click and on Enter: what happens in its actions stays there.
      render: (a) => (
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <span
          className="fg-autolist-actions"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {renderActions(a)}
        </span>
      ),
    });
  }
  return (
    <Table
      className={cx("fg-autolist", className)}
      label={label}
      columns={columns}
      rows={automations}
      rowKey={(a) => a.id}
      empty={empty}
      {...(onOpen ? { onRowClick: onOpen } : {})}
    />
  );
}
