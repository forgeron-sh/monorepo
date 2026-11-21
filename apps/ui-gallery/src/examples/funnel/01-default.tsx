import { Funnel } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 380 }}>
      <Funnel
        title="Deals by stage"
        unit="deals"
        highlight="Won"
        items={[
          { label: "Lead", value: 480 },
          { label: "Qualified", value: 212 },
          { label: "Proposal", value: 96 },
          { label: "Won", value: 38 },
        ]}
      />
    </div>
  );
}
