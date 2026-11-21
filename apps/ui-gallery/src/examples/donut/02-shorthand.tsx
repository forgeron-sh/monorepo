import { Donut } from "@forgeron/ui";

export default function Default() {
  return (
    <Donut
      title="Leads by source"
      items={[
        { label: "Website", value: 412 },
        { label: "Referral", value: 238 },
        { label: "Events", value: 126 },
        { label: "Outbound", value: 74 },
      ]}
    />
  );
}
