import { AuditLog } from "@forgeron/ui";

export default function Empty() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <AuditLog events={[]} empty="No event matches these filters" />
    </div>
  );
}
