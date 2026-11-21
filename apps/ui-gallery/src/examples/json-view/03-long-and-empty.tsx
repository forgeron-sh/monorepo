import { JsonView } from "@forgeron/ui";

const orders = Array.from({ length: 12 }, (_, i) => ({
  order: `SO-${4410 + i}`,
  weight: 20 + i * 17,
  to: ["Grenoble", "Lyon", "Annecy"][i % 3],
  express: i % 4 === 0,
}));

export default function LongAndEmpty() {
  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 520 }}>
      <JsonView label="Input · 12 items" value={orders} maxHeight={220} />
      <JsonView label="Output" value={undefined} empty="Not run yet" />
    </div>
  );
}
