// Without the word, it is still read aloud: "up, Better".
import { DeltaBadge } from "@forgeron/ui";

export default function Compact() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <DeltaBadge size="sm" showWord={false} delta={0.124} />
      <DeltaBadge size="sm" showWord={false} delta={-0.06} />
      <DeltaBadge size="sm" showWord={false} delta={0} />
    </div>
  );
}
