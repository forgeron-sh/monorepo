// The kind comes from the name; the size is written for people.
import { fileKindOf, FileTypeMark, FILE_KINDS, formatBytes } from "@forgeron/ui";

const files = [
  ["Dock plan.pdf", 240_000],
  ["Tariffs 2027.xlsx", 52_400],
  ["Kick-off 2027.pptx", 3_400_000],
  ["Forklift safety.mp4", 48_000_000],
  ["deploy.yaml", 840],
] as const;

export default function FromNames() {
  return (
    <ul style={{ display: "grid", gap: 8, margin: 0, padding: 0, listStyle: "none", width: 320 }}>
      {files.map(([name, size]) => {
        const kind = fileKindOf(name);
        return (
          <li key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileTypeMark kind={kind} />
            <span style={{ flex: 1 }}>{name}</span>
            <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
              {FILE_KINDS[kind].label} · {formatBytes(size)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
