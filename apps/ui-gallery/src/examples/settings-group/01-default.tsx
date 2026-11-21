import {
  SettingsGroup,
  SettingsGroupCard,
  SettingsGroupDescription,
  SettingsGroupHeader,
  SettingsGroupTitle,
  SettingsRow,
  SettingsRowControl,
  SettingsRowDescription,
  SettingsRowLabel,
  SettingsRowText,
  Switch,
} from "@forgeron/ui";

// A group and its rows from their parts: you decide what is in the header and in each row.
export default function Composed() {
  return (
    <div style={{ width: 380 }}>
      <SettingsGroup>
        <SettingsGroupHeader>
          <SettingsGroupTitle>Notifications</SettingsGroupTitle>
          <SettingsGroupDescription>Where and when we write to you.</SettingsGroupDescription>
        </SettingsGroupHeader>
        <SettingsGroupCard>
          <SettingsRow>
            <SettingsRowText>
              <SettingsRowLabel>Email digest</SettingsRowLabel>
              <SettingsRowDescription>One email a day, at 8:00.</SettingsRowDescription>
            </SettingsRowText>
            <SettingsRowControl>
              <Switch label="" aria-label="Email digest" defaultChecked />
            </SettingsRowControl>
          </SettingsRow>
        </SettingsGroupCard>
      </SettingsGroup>
    </div>
  );
}
