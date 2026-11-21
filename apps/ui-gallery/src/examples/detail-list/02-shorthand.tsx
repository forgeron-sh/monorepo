import { DetailList } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 240 }}>
      <DetailList
        items={[
          { label: "Version", value: "1.4.0" },
          { label: "Channel", value: "Production" },
          { label: "Updated", value: "Nov 17" },
        ]}
      />
    </div>
  );
}
