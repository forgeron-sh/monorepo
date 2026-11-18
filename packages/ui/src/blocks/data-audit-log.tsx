// The audit log of a workspace, after the Console prototype: who did what to which thing, and
// when, one dense row each, grouped by day under a closed band. A row with detail (the request,
// the reason of a refusal) folds open under itself. Refusals and failures say so in words; a
// success says nothing.

import { ArrowDown01Icon, ArrowRight01Icon, type IconDefinition } from "@forgeron/icons";
import { useId, useState, type ReactNode } from "react";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { cx } from "../cx";
import { addDays, formatShort, parseIso } from "../dates";
import { Icon } from "../icon";

export interface AuditEvent {
  id: string;
  /** When, local time: `YYYY-MM-DD HH:MM`. */
  at: string;
  /** Who: a person's name, or a tool's. */
  actor: string;
  /** A pixel icon in place of initials, for a tool or the system. */
  actorIcon?: IconDefinition;
  /** What they did, as a verb phrase: `deployed`, `revoked the access of`. */
  action: string;
  /** To what, in mono after the action: `invoices-sync v1.4`. */
  target?: string;
  /** `ok` (default) shows nothing; a refusal or a failure is written on the row. */
  outcome?: "ok" | "denied" | "failed";
  /** Shown when the row is opened: the request, the reason, the diff. */
  detail?: ReactNode;
}

export interface AuditLogProps {
  /** Newest first. */
  events: ReadonlyArray<AuditEvent>;
  /** YYYY-MM-DD: its day and the day before read Today and Yesterday. */
  today?: string;
  /** The ids of the rows open at first. */
  defaultExpanded?: ReadonlyArray<string>;
  /** Names the log for assistive technology. */
  label?: string;
  /** Shown when there is no event. */
  empty?: ReactNode;
  className?: string;
}

const OUTCOME = {
  denied: { tone: "warning", text: "Denied" },
  failed: { tone: "danger", text: "Failed" },
} as const;

function dayName(day: string, today?: string) {
  if (today && day === today) return `Today · ${formatShort(day)}`;
  if (today && day === addDays(today, -1)) return `Yesterday · ${formatShort(day)}`;
  return formatShort(day, today ? parseIso(today).getFullYear() : undefined);
}

/** Events by day, newest first: time, actor, action and target, outcome; detail folds open. */
export function AuditLog({
  events,
  today,
  defaultExpanded = [],
  label = "Audit log",
  empty = "Nothing happened yet",
  className,
}: AuditLogProps) {
  const base = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded));
  const toggle = (id: string) =>
    setOpen((before) => {
      const next = new Set(before);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (events.length === 0) {
    return <div className={cx("fg-audit fg-audit-empty", className)}>{empty}</div>;
  }

  const days: { day: string; events: AuditEvent[] }[] = [];
  for (const event of events) {
    const day = event.at.slice(0, 10);
    const last = days[days.length - 1];
    if (last?.day === day) last.events.push(event);
    else days.push({ day, events: [event] });
  }

  return (
    <section className={cx("fg-audit", className)} aria-label={label}>
      {days.map(({ day, events: rows }) => (
        <div key={day} className="fg-audit-group">
          <h3 className="fg-audit-day">
            <span>{dayName(day, today)}</span>
          </h3>
          <ol className="fg-audit-list">
            {rows.map((event) => {
              const time = event.at.slice(11, 16);
              const outcome =
                event.outcome && event.outcome !== "ok" ? OUTCOME[event.outcome] : null;
              const isOpen = open.has(event.id);
              const panel = `${base}-${event.id}`;
              const line = (
                <>
                  <time className="fg-audit-time" dateTime={`${day}T${time}`}>
                    {time}
                  </time>
                  <span className="fg-audit-who">
                    {event.actorIcon ? (
                      <span className="fg-audit-mark">
                        <Icon icon={event.actorIcon} size={12} variant="mono" />
                      </span>
                    ) : (
                      <Avatar name={event.actor} size={20} />
                    )}
                    <span className="fg-audit-actor">{event.actor}</span>
                  </span>
                  <span className="fg-audit-what">
                    {event.action}
                    {event.target ? <code className="fg-audit-target">{event.target}</code> : null}
                  </span>
                  <span className="fg-audit-end">
                    {outcome ? <Badge tone={outcome.tone}>{outcome.text}</Badge> : null}
                    {event.detail ? (
                      <Icon
                        icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon}
                        size={12}
                        variant="mono"
                        className="fg-audit-chev"
                      />
                    ) : null}
                  </span>
                </>
              );
              return (
                <li
                  key={event.id}
                  className={cx("fg-audit-row", outcome && `fg-audit-${event.outcome}`)}
                >
                  {event.detail ? (
                    <button
                      type="button"
                      className="fg-audit-line"
                      aria-expanded={isOpen}
                      aria-controls={panel}
                      onClick={() => toggle(event.id)}
                    >
                      {line}
                    </button>
                  ) : (
                    <div className="fg-audit-line">{line}</div>
                  )}
                  {event.detail ? (
                    <div id={panel} className="fg-audit-detail" hidden={!isOpen}>
                      {event.detail}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
