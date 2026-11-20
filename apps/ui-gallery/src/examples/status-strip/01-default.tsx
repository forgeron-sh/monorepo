import { StatusStrip, type StatusStripItem } from "@forgeron/ui";

const incidents: Record<number, Pick<StatusStripItem, "status" | "note">> = {
  12: { status: "degraded", note: "Slow webhooks, 40 min" },
  31: { status: "down", note: "Odoo unreachable, 12 min" },
  32: { status: "degraded", note: "Retries draining" },
  58: { status: "degraded", note: "Queue backlog, 25 min" },
  77: { status: "down", note: "Certificate expired, 6 min" },
};

const day = (i: number) => {
  const d = new Date(Date.UTC(2026, 7, 23 + i));
  return d.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
};

const items: StatusStripItem[] = Array.from({ length: 90 }, (_, i) => ({
  label: day(i),
  status: "ok",
  ...incidents[i],
}));

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <StatusStrip title="Gateway, last 90 days" items={items} from="90 days ago" to="Today" />
    </div>
  );
}
