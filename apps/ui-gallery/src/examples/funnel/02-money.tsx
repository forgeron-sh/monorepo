// The numbers are any unit: format writes them.
import { Funnel } from "@forgeron/ui";

const eur = (n: number) => `€${(n / 1000).toFixed(0)}k`;

export default function Money() {
  return (
    <div style={{ width: 420 }}>
      <Funnel
        title="Pipeline value"
        format={eur}
        items={[
          { label: "Open", value: 820_000 },
          { label: "Negotiation", value: 410_000 },
          { label: "Signed", value: 150_000 },
        ]}
      />
    </div>
  );
}
