import {
  ArrowUpRight01Icon,
  Copy01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  NotificationOff01Icon,
} from "@forgeron/icons";
import {
  ActionMenu,
  Avatar,
  IconButton,
  PRIORITY_NAMES,
  PriorityGlyph,
  STATUS_NAMES,
  StatusGlyph,
  type ActionMenuEntry,
  type PriorityLevel,
  type StatusKind,
} from "@forgeron/ui";
import { useState } from "react";

const statuses: StatusKind[] = ["backlog", "todo", "progress", "review", "done", "canceled"];
const priorities: PriorityLevel[] = [0, 1, 2, 3, 4];
const people = ["Camille Roy", "Hugo Bernard", "Léa Martin", "Nadia Petit", "Tom Garnier"];

export default function Issue() {
  const [status, setStatus] = useState<StatusKind>("progress");
  const [priority, setPriority] = useState<PriorityLevel>(2);
  const [assignee, setAssignee] = useState("Hugo Bernard");
  const [subscribed, setSubscribed] = useState(true);
  const [said, setSaid] = useState("");

  const items: ActionMenuEntry[] = [
    {
      id: "status",
      label: "Status",
      glyph: <StatusGlyph status={status} />,
      kbd: "S",
      items: statuses.map((s, i) => ({
        id: `status:${s}`,
        label: STATUS_NAMES[s],
        glyph: <StatusGlyph status={s} />,
        kbd: String(i + 1),
        checked: s === status,
      })),
    },
    {
      id: "priority",
      label: "Priority",
      glyph: <PriorityGlyph level={priority} />,
      kbd: "P",
      items: priorities.map((p) => ({
        id: `priority:${p}`,
        label: PRIORITY_NAMES[p],
        glyph: <PriorityGlyph level={p} />,
        kbd: String(p),
        checked: p === priority,
      })),
    },
    {
      id: "assignee",
      label: "Assignee",
      glyph: <Avatar name={assignee} size={14} />,
      kbd: "A",
      items: people.map((name) => ({
        id: `assignee:${name}`,
        label: name === "Camille Roy" ? `${name} (you)` : name,
        glyph: <Avatar name={name} size={14} />,
        checked: name === assignee,
      })),
    },
    { separator: true },
    { id: "open", label: "Open issue", icon: ArrowUpRight01Icon, kbd: "↵" },
    { id: "copy", label: "Copy ID", icon: Copy01Icon },
    {
      id: "subscribe",
      label: subscribed ? "Unsubscribe" : "Subscribe",
      icon: subscribed ? NotificationOff01Icon : Notification01Icon,
    },
    { separator: true },
    { id: "delete", label: "Delete issue", icon: Delete02Icon, danger: true },
  ];

  const onSelect = (id: string) => {
    const [field, value = ""] = id.split(":");
    if (field === "status") setStatus(value as StatusKind);
    else if (field === "priority") setPriority(Number(value) as PriorityLevel);
    else if (field === "assignee") setAssignee(value);
    else if (field === "subscribe") setSubscribed(!subscribed);
    setSaid(`Chose ${id}`);
  };

  return (
    <div style={{ width: "100%", display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 44,
          padding: "0 8px 0 12px",
          border: "1px solid var(--line)",
          background: "var(--bg)",
        }}
      >
        <PriorityGlyph level={priority} />
        <span style={{ color: "var(--ink-dim)", font: "400 11.5px/1 var(--font-mono)" }}>
          OPS-40
        </span>
        <StatusGlyph status={status} />
        <span style={{ flex: 1 }}>Supplier invoices arrive twice from Odoo</span>
        <Avatar name={assignee} size={20} />
        <ActionMenu
          label="Actions on OPS-40"
          trigger={<IconButton icon={MoreHorizontalIcon} label="Issue actions" size="sm" />}
          align="end"
          items={items}
          onSelect={onSelect}
        />
      </div>
      {said ? (
        <span style={{ color: "var(--ink-dim)", font: "400 12px/1 var(--font-mono)" }}>{said}</span>
      ) : null}
    </div>
  );
}
