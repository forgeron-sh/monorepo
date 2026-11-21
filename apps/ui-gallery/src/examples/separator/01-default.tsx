import { Separator } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
      <div>
        <strong>Forgeron UI</strong>
        <p style={{ margin: 0 }}>The components of the lab.</p>
      </div>
      <Separator />
      <div style={{ display: "flex", alignItems: "center", gap: 12, height: 20 }}>
        <span>Blog</span>
        <Separator orientation="vertical" decorative />
        <span>Docs</span>
        <Separator orientation="vertical" decorative />
        <span>Source</span>
      </div>
    </div>
  );
}
