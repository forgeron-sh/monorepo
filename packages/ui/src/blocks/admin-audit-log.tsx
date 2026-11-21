// The audit log of a workspace, after the Console prototype: who did what to which thing, and
// when, one dense row each, grouped by day under a closed band. A row with detail (the request,
// the reason of a refusal) folds open under itself. Refusals and failures say so in words; a
// success says nothing.
//
// A root with parts, on the `Feed` of timeline.tsx. Without children it draws the days and their
// events; with children they are yours: `AuditLogDay` (a day's group) holding `AuditLogEvent`s, or
// `AuditLogEmpty`.

import { ArrowDown01Icon, ArrowRight01Icon, type IconDefinition } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { cx } from "../cx";
import { dayLabel, groupByDay } from "../dates";
import { Icon } from "../icon";
import { Feed, FeedGroup, FeedGroupLabel, FeedItem, FeedTime } from "../timeline";

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
  /** The days, composed from the parts; without them, one `AuditLogDay` for each day. */
  children?: ReactNode;
  className?: string;
}

const OUTCOME = {
  denied: { tone: "warning", text: "Denied" },
  failed: { tone: "danger", text: "Failed" },
} as const;

interface AuditContext {
  base: string;
  today: string | undefined;
  empty: ReactNode;
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
}

const Ctx = createContext<AuditContext | null>(null);

/** Which rows are open, and `today`, for a part of your own inside an `AuditLog`. */
export function useAuditLog(part = "useAuditLog"): AuditContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside an <AuditLog>.`);
  return ctx;
}

/** Events by day, newest first: time, actor, action and target, outcome; detail folds open. */
export function AuditLog({
  events,
  today,
  defaultExpanded = [],
  label = "Audit log",
  empty = "Nothing happened yet",
  children,
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
  const ctx: AuditContext = { base, today, empty, isOpen: (id) => open.has(id), toggle };

  if (events.length === 0 && children === undefined) {
    return (
      <Ctx.Provider value={ctx}>
        <div data-slot="audit-log" className={cx("fg-audit fg-audit-empty", className)}>
          {empty}
        </div>
      </Ctx.Provider>
    );
  }
  return (
    <Ctx.Provider value={ctx}>
      <section data-slot="audit-log" className={cx("fg-audit", className)} aria-label={label}>
        {children ??
          groupByDay(events, (event) => event.at).map(({ day, items: rows }) => (
            <AuditLogDay key={day} day={day}>
              {rows.map((event) => (
                <AuditLogEvent key={event.id} event={event} />
              ))}
            </AuditLogDay>
          ))}
      </section>
    </Ctx.Provider>
  );
}

/** Says so when nothing happened. */
export function AuditLogEmpty({ className, children, ...rest }: ComponentProps<"div">) {
  const { empty } = useAuditLog("AuditLogEmpty");
  return (
    <div data-slot="audit-log-empty" {...rest} className={cx("fg-audit-empty", className)}>
      {children ?? empty}
    </div>
  );
}

/** One day: its band (Today, Yesterday, the date) and the events under it. */
export function AuditLogDay({
  day,
  children,
  ...rest
}: ComponentProps<typeof FeedGroup> & { day: string }) {
  const { today } = useAuditLog("AuditLogDay");
  return (
    <FeedGroup data-slot="audit-log-day" {...rest}>
      <FeedGroupLabel>{dayLabel(day, today)}</FeedGroupLabel>
      <Feed connector={false}>{children}</Feed>
    </FeedGroup>
  );
}

/** One event: time, actor, what they did, the outcome; its detail folds open under it. */
export function AuditLogEvent({
  event,
  className,
  ...rest
}: Omit<ComponentProps<typeof FeedItem>, "children"> & { event: AuditEvent }) {
  const { base, isOpen, toggle } = useAuditLog("AuditLogEvent");
  const day = event.at.slice(0, 10);
  const time = event.at.slice(11, 16);
  const outcome = event.outcome && event.outcome !== "ok" ? OUTCOME[event.outcome] : null;
  const open = isOpen(event.id);
  const panel = `${base}-${event.id}`;
  const line = (
    <>
      <FeedTime className="fg-audit-time" dateTime={`${day}T${time}`}>
        {time}
      </FeedTime>
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
            icon={open ? ArrowDown01Icon : ArrowRight01Icon}
            size={12}
            variant="mono"
            className="fg-audit-chev"
          />
        ) : null}
      </span>
    </>
  );
  return (
    <FeedItem
      data-slot="audit-log-event"
      {...rest}
      className={cx("fg-audit-row", outcome && `fg-audit-${event.outcome}`, className)}
    >
      {event.detail ? (
        <button
          type="button"
          className="fg-audit-line"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => toggle(event.id)}
        >
          {line}
        </button>
      ) : (
        <div className="fg-audit-line">{line}</div>
      )}
      {event.detail ? (
        <div id={panel} className="fg-audit-detail" hidden={!open}>
          {event.detail}
        </div>
      ) : null}
    </FeedItem>
  );
}
