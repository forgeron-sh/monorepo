import { StackedBar } from "@forgeron/ui";

export default function Shares() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <StackedBar
        title="Channel mix"
        normalize
        series={[
          { key: "mail", label: "Mail" },
          { key: "chat", label: "Chat" },
          { key: "phone", label: "Phone" },
        ]}
        items={[
          { label: "Sales", values: { mail: 40, chat: 30, phone: 10 } },
          { label: "Support", values: { mail: 20, chat: 90, phone: 40 } },
        ]}
      />
    </div>
  );
}
