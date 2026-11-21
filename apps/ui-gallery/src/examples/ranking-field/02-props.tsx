import { RankingField } from "@forgeron/ui";
import { useState } from "react";

const items = [
  { id: "api", label: "A public API" },
  { id: "mobile", label: "A mobile app" },
  { id: "sso", label: "Single sign-on" },
  { id: "audit", label: "An audit log" },
];

export default function Default() {
  const [order, setOrder] = useState<string[] | null>(null);
  return (
    <div style={{ display: "grid", gap: 12, width: 420, maxWidth: "100%" }}>
      <RankingField
        label="Rank these by how much you want them"
        items={items}
        value={order}
        onChange={setOrder}
      />
      <p style={{ margin: 0, font: "12px/18px var(--font-mono)", color: "var(--ink-muted)" }}>
        {order ? order.join(" > ") : "not ordered yet"}
      </p>
    </div>
  );
}
