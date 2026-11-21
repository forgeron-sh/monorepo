import { AddressField, type FormAddress } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [address, setAddress] = useState<FormAddress>({});
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AddressField label="Delivery address" value={address} onChange={setAddress} />
      <pre style={{ margin: 0, font: "12px/18px var(--font-mono)", color: "var(--ink-muted)" }}>
        {JSON.stringify(address)}
      </pre>
    </div>
  );
}
