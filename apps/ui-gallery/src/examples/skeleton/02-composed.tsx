import { Skeleton } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Skeleton style={{ width: 40, height: 40 }} />
      <div style={{ display: "grid", gap: 8 }}>
        <Skeleton style={{ width: 250, height: 16 }} />
        <Skeleton style={{ width: 200, height: 16 }} />
      </div>
    </div>
  );
}
