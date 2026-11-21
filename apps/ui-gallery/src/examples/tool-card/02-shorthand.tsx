import { Badge, ToolCard } from "@forgeron/ui";

export default function Default() {
  return (
    <ul style={{ width: 280, margin: 0, padding: 0 }}>
      <ToolCard
        name="Invoices sync"
        summary="Brings supplier invoices from Odoo into the ledger every hour."
        href="#/tools/invoices-sync"
        onNavigate={() => {}}
        meta={
          <>
            <Badge mono>1.4.0</Badge>
            <Badge tone="success" dot>
              Live
            </Badge>
          </>
        }
      />
    </ul>
  );
}
