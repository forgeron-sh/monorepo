import { Page, Select, SettingsGroup, SettingsRow } from "@forgeron/ui";
import { THEMES, useThemePreference, type ThemePreference } from "../../../shell/theme";
import { SettingsStack } from "../components/settings-stack";

export default function PreferencesPage() {
  const [theme, setTheme] = useThemePreference();
  return (
    <Page title="Preferences" description="How the console looks for you, in this browser.">
      <SettingsStack>
        <SettingsGroup title="Appearance">
          <SettingsRow
            label="Theme"
            description="System follows your device. Forge is dark, Atelier is light."
          >
            <Select
              aria-label="Theme"
              value={theme}
              options={THEMES.map((t) => ({ value: t.id, label: t.label }))}
              onChange={(e) => setTheme(e.target.value as ThemePreference)}
            />
          </SettingsRow>
          <SettingsRow label="Language" description="The console is in English for now.">
            <span>English</span>
          </SettingsRow>
        </SettingsGroup>
      </SettingsStack>
    </Page>
  );
}
