import { CtaBand } from "@forgeron/ui";

export default function Default() {
  return (
    <CtaBand
      title={["Forge your", "first tool."]}
      lead="Pick it, shape it, ship it. Open source, Apache-2.0."
      action={{ href: "#start", label: "Get started" }}
      command="npx forgeron init"
    >
      <div className="fg-dots" style={{ position: "absolute", inset: 0 }} />
    </CtaBand>
  );
}
