import { PackageIcon } from "@forgeron/icons";
import { AuditLog } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 400 }}>
      <AuditLog
        today="2026-11-18"
        events={[
          {
            id: "e3",
            at: "2026-11-18 09:42",
            actor: "Camille Roy",
            action: "deployed",
            target: "invoices-sync 1.4",
          },
          {
            id: "e2",
            at: "2026-11-18 09:15",
            actor: "crm-import",
            actorIcon: PackageIcon,
            action: "read",
            target: "crm.leads",
            outcome: "denied",
          },
          {
            id: "e1",
            at: "2026-11-17 17:03",
            actor: "Hugo Bernard",
            action: "invited",
            target: "lea@roy.fr",
          },
        ]}
      />
    </div>
  );
}
