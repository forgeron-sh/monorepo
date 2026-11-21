import { ScrollArea, ScrollBar } from "@forgeron/ui";

export default function Horizontal() {
  return (
    <ScrollArea style={{ width: 320 }}>
      <div style={{ display: "flex", gap: 8, padding: 12, width: "max-content" }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 96,
              height: 64,
              display: "grid",
              placeItems: "center",
              border: "1px solid var(--line)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
