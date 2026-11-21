import { SettingsGroup, SettingsRow, Switch } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 380 }}>
      <SettingsGroup title="Notifications">
        <SettingsRow label="Email digest" description="One email a day, at 8:00.">
          <Switch label="" aria-label="Email digest" defaultChecked />
        </SettingsRow>
        <SettingsRow
          label="Language"
          href="#/settings/language"
          value="English"
          onNavigate={() => {}}
        />
      </SettingsGroup>
    </div>
  );
}
