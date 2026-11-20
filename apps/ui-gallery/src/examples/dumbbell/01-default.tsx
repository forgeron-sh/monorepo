import { Dumbbell } from "@forgeron/ui";

// Response time per team, last quarter and this one: down is good news.
export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Dumbbell
        title="First response, hours"
        fromLabel="Q3"
        toLabel="Q4"
        better="down"
        format={(v) => `${v} h`}
        items={[
          { label: "Support", from: 6.5, to: 3.2 },
          { label: "Billing", from: 4.1, to: 4.6 },
          { label: "Onboarding", from: 9.8, to: 5.1 },
          { label: "Partners", from: 3.0, to: 3.0 },
          { label: "Sales", from: 2.4, to: 3.9 },
        ]}
      />
    </div>
  );
}
