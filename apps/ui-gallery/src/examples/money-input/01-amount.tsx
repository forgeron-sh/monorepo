import { MoneyInput } from "@forgeron/ui";
import { useState } from "react";

export default function Amount() {
  const [cents, setCents] = useState<number | null>(123450);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <MoneyInput label="Price" currency="EUR" locale="fr-FR" value={cents} onChange={setCents} />
      <code>{cents === null ? "none" : `${cents} minor units`}</code>
    </div>
  );
}
