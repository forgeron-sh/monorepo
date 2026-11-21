import { VersionHistory } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <VersionHistory
        live={4}
        draft={[
          { kind: "add", text: "Step “Mail the CFO”" },
          { kind: "change", text: "Above €5,000?: compare to" },
        ]}
        versions={[
          {
            version: 4,
            message: "Escalate amounts above €5,000",
            at: "2026-11-16 17:20",
            by: "Camille Roy",
            changes: [
              { kind: "add", text: "Step “Above €5,000?”" },
              { kind: "add", text: "Wire Above €5,000? → Draft the invoice (true)" },
            ],
          },
          {
            version: 3,
            message: "Thank the client by mail",
            at: "2026-11-09 11:02",
            by: "Hugo Bernard",
            changes: [{ kind: "add", text: "Step “Thank the client”" }],
          },
          {
            version: 2,
            message: "Post in #sales, not #general",
            at: "2026-11-02 09:40",
            by: "Léa Martin",
            changes: [{ kind: "change", text: "Tell #sales: channel" }],
          },
        ]}
        onPublish={() => {}}
        onDiscard={() => {}}
        onRestore={() => {}}
      />
    </div>
  );
}
