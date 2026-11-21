import { AuditLog, AuditLogDay, AuditLogEvent, type AuditEvent } from "@forgeron/ui";

const events: AuditEvent[] = [
  {
    id: "e3",
    at: "2026-11-18 09:42",
    actor: "Camille Roy",
    action: "deployed",
    target: "invoices-sync 1.4",
  },
  {
    id: "e1",
    at: "2026-11-17 17:03",
    actor: "Hugo Bernard",
    action: "invited",
    target: "lea@roy.fr",
    detail: "Role: member",
  },
];

export default function Composed() {
  return (
    <div style={{ width: 400 }}>
      <AuditLog events={events} today="2026-11-18">
        <AuditLogDay day="2026-11-18">
          <AuditLogEvent event={events[0]!} />
        </AuditLogDay>
        <AuditLogDay day="2026-11-17">
          <AuditLogEvent event={events[1]!} />
        </AuditLogDay>
      </AuditLog>
    </div>
  );
}
