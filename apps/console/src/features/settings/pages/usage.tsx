import { Page, SettingsGroup, Stat } from "@forgeron/ui";
import type { PageProps } from "../../../shell/page-props";
import { SettingsStack } from "../components/settings-stack";

export default function UsagePage({ ws }: PageProps) {
  const { setup } = ws;
  return (
    <Page title="Usage and seats" description="What this workspace holds today.">
      <SettingsStack>
        <SettingsGroup title="Seats">
          <div className="fc-stats" style={{ padding: "var(--space-4)" }}>
            <Stat label="Members" value={setup.members} />
            <Stat label="Pending invitations" value={setup.invitations} />
          </div>
        </SettingsGroup>
        <SettingsGroup title="Tools">
          <div className="fc-stats" style={{ padding: "var(--space-4)" }}>
            <Stat label="Tools" value={setup.tools} />
            <Stat label="Deployed" value={setup.deployed} hint="with a version in an environment" />
          </div>
        </SettingsGroup>
      </SettingsStack>
    </Page>
  );
}
