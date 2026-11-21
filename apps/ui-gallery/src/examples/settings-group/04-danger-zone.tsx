import { Button, SettingsGroup, SettingsRow } from "@forgeron/ui";

// Last on the page, outlined in red.
export default function DangerZone() {
  return (
    <div style={{ width: "100%", maxWidth: 620 }}>
      <SettingsGroup tone="danger" title="Danger zone" description="These cannot be undone.">
        <SettingsRow label="Transfer ownership" description="Another owner takes over billing.">
          <Button size="sm">Transfer</Button>
        </SettingsRow>
        <SettingsRow label="Delete the workspace" description="Its tools, data and members.">
          <Button size="sm" variant="danger">
            Delete
          </Button>
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
