import { Donut } from "@forgeron/ui";

export default function Highlight() {
  return (
    <Donut
      title="Spend by category"
      size={140}
      thickness={10}
      highlight="Software"
      format={(n) => `€${n}k`}
      items={[
        { label: "Software", value: 48 },
        { label: "Travel", value: 21 },
        { label: "Hardware", value: 17 },
        { label: "Other", value: 9 },
      ]}
      center={
        <>
          <b>€95k</b>
          <small>Q4</small>
        </>
      }
    />
  );
}
