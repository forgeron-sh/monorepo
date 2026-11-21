import { Avatar, Badge, DetailList } from "@forgeron/ui";

// Values are any node: a badge, a person, an identifier in mono.
export default function BesideARecord() {
  return (
    <div style={{ width: 280 }}>
      <DetailList
        items={[
          {
            label: "Status",
            value: (
              <Badge tone="success" dot>
                Paid
              </Badge>
            ),
          },
          {
            label: "Customer",
            value: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Avatar name="Maison Roy" size={20} />
                Maison Roy
              </span>
            ),
          },
          { label: "Reference", value: <code>INV-2041</code> },
          { label: "Amount", value: "€1,240.00" },
          { label: "Note", value: "Paid by transfer, two days after the due date." },
        ]}
      />
    </div>
  );
}
