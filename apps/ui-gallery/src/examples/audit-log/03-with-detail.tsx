import { PackageIcon, ServerStack01Icon } from "@forgeron/icons";
import { AuditLog } from "@forgeron/ui";

// A row with detail is a button: it folds open under itself.
export default function WithDetail() {
  return (
    <div style={{ width: "100%" }}>
      <AuditLog
        today="2026-11-18"
        defaultExpanded={["e5"]}
        events={[
          {
            id: "e6",
            at: "2026-11-18 10:02",
            actor: "Camille Roy",
            action: "gave the team Sales access to",
            target: "crm-import",
          },
          {
            id: "e5",
            at: "2026-11-18 09:15",
            actor: "crm-import",
            actorIcon: PackageIcon,
            action: "read",
            target: "crm.leads",
            outcome: "denied",
            detail:
              "Permission crm.leads.read is not granted to crm-import. Asked by Hugo Bernard.",
          },
          {
            id: "e4",
            at: "2026-11-18 03:00",
            actor: "Scheduler",
            actorIcon: ServerStack01Icon,
            action: "ran",
            target: "carrier-rates nightly",
            outcome: "failed",
            detail: "Upstream answered 503 three times; next try at 04:00.",
          },
          {
            id: "e3",
            at: "2026-11-17 17:03",
            actor: "Hugo Bernard",
            action: "rolled back",
            target: "invoices-sync 1.3",
            detail: "From 1.4.0 to 1.3.2 on Production. Reason: invoices arrive twice.",
          },
          {
            id: "e2",
            at: "2026-11-17 16:40",
            actor: "Léa Martin",
            action: "changed the secret",
            target: "ODOO_API_KEY",
          },
          {
            id: "e1",
            at: "2026-11-12 11:20",
            actor: "Camille Roy",
            action: "installed",
            target: "crm-import 0.9",
          },
        ]}
      />
    </div>
  );
}
