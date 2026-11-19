import { DocumentHeader, MetaTable, PartyBlock, StatusBadge } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 24, width: 560, maxWidth: "100%" }}>
      <DocumentHeader
        title="Invoice"
        number="INV-2026-0042"
        brand={<strong>Atelier Exemple</strong>}
        status={<StatusBadge status="sent" />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <PartyBlock
          label="From"
          name="Atelier Exemple"
          lines={["1 Test Street", "00000 Sampletown", "Tax ID XX000000"]}
        />
        <PartyBlock
          label="Bill to"
          name="Client Exemple"
          lines={["2 Sample Avenue", "00000 Sampletown"]}
        />
      </div>
      <MetaTable
        rows={[
          { label: "Issued", value: "2026-11-19" },
          { label: "Due", value: "2026-12-19" },
          { label: "Reference", value: "PO-7781" },
        ]}
      />
    </div>
  );
}
