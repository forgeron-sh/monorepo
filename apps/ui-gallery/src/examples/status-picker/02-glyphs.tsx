import { STATUS_NAMES, StatusGlyph, type StatusKind } from "@forgeron/ui";

const all: StatusKind[] = ["backlog", "todo", "progress", "review", "done", "canceled"];

export default function Glyphs() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {all.map((s) => (
        <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <StatusGlyph status={s} size={24} />
          {STATUS_NAMES[s]}
        </span>
      ))}
    </div>
  );
}
