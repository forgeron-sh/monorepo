import { SealBadge } from "@forgeron/ui";

export default function Compact() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <SealBadge compact who="Karim Aziz" at="2026-11-18T09:05:00Z" hash="91be07f2c3" />
      <SealBadge
        compact
        who="Jo Bernard"
        action="Rejected"
        at="2026-11-18T11:40:00Z"
        state="revoked"
      />
    </div>
  );
}
