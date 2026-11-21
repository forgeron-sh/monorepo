import { Button, Select, SettingsGroup, SettingsRow, Switch } from "@forgeron/ui";
import { useState } from "react";

export default function SettingsPage() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 32, width: "100%", maxWidth: 620 }}>
      <SettingsGroup title="Workspace" description="What everyone in Maison Roy sees.">
        <SettingsRow label="Name" description="Shown in the sidebar and in emails.">
          <Button size="sm">Rename</Button>
        </SettingsRow>
        <SettingsRow label="Week starts on">
          <Select
            aria-label="Week starts on"
            defaultValue="monday"
            options={[
              { value: "monday", label: "Monday" },
              { value: "sunday", label: "Sunday" },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          label="Members"
          description="People and their teams."
          href="#/settings/members"
          value="48 people"
          onNavigate={(href) => setOpened(href)}
        />
        <SettingsRow
          label="Identity provider"
          href="#/settings/sso"
          value="Microsoft Entra ID"
          onNavigate={(href) => setOpened(href)}
        />
      </SettingsGroup>
      <SettingsGroup title="Security">
        <SettingsRow label="Two-step sign-in" description="Asked of every member at sign-in.">
          <Switch label="" aria-label="Two-step sign-in" />
        </SettingsRow>
      </SettingsGroup>
      {opened ? <p style={{ margin: 0, color: "var(--ink-muted)" }}>Opened: {opened}</p> : null}
    </div>
  );
}
