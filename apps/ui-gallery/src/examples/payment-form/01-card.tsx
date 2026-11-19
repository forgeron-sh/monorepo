import { PaymentForm } from "@forgeron/ui";
import { useState } from "react";

export default function Card() {
  const [done, setDone] = useState("");
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <PaymentForm
        submitLabel="Pay 120.00 EUR"
        onSubmit={(p) => setDone(p.method === "card" ? `Test card ending ${p.last4} accepted` : "")}
      />
      {done ? <p style={{ margin: 0, font: "12px var(--font-mono)" }}>{done}</p> : null}
    </div>
  );
}
