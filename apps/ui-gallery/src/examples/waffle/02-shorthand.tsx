import { Waffle } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <Waffle
        title="Tickets by channel"
        items={[
          { label: "Email", value: 412 },
          { label: "Chat", value: 238 },
          { label: "Phone", value: 126 },
          { label: "Portal", value: 74 },
        ]}
      />
    </div>
  );
}
