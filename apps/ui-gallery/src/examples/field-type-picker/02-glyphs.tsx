// Every type with its pixel glyph and what SQLite stores it as.
import { FIELD_TYPES, FieldTypeGlyph } from "@forgeron/ui";

export default function Glyphs() {
  return (
    <ul
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 8,
        width: "100%",
        margin: 0,
        padding: 0,
        listStyle: "none",
      }}
    >
      {FIELD_TYPES.map((t) => (
        <li
          key={t.type}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            border: "1px solid var(--line)",
            font: "400 13px/18px var(--font-sans)",
          }}
        >
          <FieldTypeGlyph type={t.type} size={24} />
          <span style={{ flex: 1 }}>{t.label}</span>
          <span style={{ font: "400 11px/16px var(--font-mono)", color: "var(--ink-dim)" }}>
            {t.storage}
          </span>
        </li>
      ))}
    </ul>
  );
}
