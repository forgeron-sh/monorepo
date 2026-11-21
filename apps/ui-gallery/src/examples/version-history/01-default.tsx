import { VersionHistory, VersionHistoryDetail, VersionHistoryList } from "@forgeron/ui";

// The list is one collection: the arrows move the choice, the detail follows.
export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <VersionHistory
        live={3}
        draft={[{ kind: "add", text: "Step “Mail the CFO”" }]}
        versions={[
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
        onRestore={() => {}}
        onPublish={() => {}}
        onDiscard={() => {}}
      >
        <VersionHistoryList />
        <VersionHistoryDetail />
      </VersionHistory>
    </div>
  );
}
