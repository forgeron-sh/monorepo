import { Button, CopyBlock, Page, SettingsGroup, SettingsRow } from "@forgeron/ui";
import { SettingsStack } from "../components/settings-stack";

export default function SecurityPage() {
  return (
    <Page title="Security" description="How you sign in, from the browser and from a terminal.">
      <SettingsStack>
        <SettingsGroup
          title="Command line"
          description="The CLI signs in with your account, in the browser."
        >
          <SettingsRow
            label="Sign in from a terminal"
            description="Opens a page to approve the device."
          >
            <CopyBlock label="Sign in from a terminal" value="forgeron login" prefix="$" />
          </SettingsRow>
        </SettingsGroup>
        <SettingsGroup title="This browser">
          <SettingsRow
            label="Sign out"
            description="Ends your session in this browser. Your sessions elsewhere are listed here once the platform can list them."
          >
            <Button href="/auth/logout">Sign out</Button>
          </SettingsRow>
        </SettingsGroup>
      </SettingsStack>
    </Page>
  );
}
