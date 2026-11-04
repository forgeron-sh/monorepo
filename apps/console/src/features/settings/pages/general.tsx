import { CopyBlock, Page, SettingsGroup, SettingsRow } from "@forgeron/ui";
import type { PageProps } from "../../../shell/page-props";
import { SettingsStack } from "../components/settings-stack";

export default function GeneralPage({ ws }: PageProps) {
  return (
    <Page title="General" description="The workspace, as people see it and as tools reach it.">
      <SettingsStack>
        <SettingsGroup title="Workspace">
          <SettingsRow label="Name" description="Shown in the workspace menu.">
            <span className="fc-mono">{ws.workspace}</span>
          </SettingsRow>
          <SettingsRow label="Address" description="Where people sign in and tools are called.">
            <CopyBlock label="Address" value={ws.endpoint} />
          </SettingsRow>
          {ws.install ? (
            <SettingsRow
              label="Base domain"
              description="The domain of every address of this install."
            >
              <span className="fc-mono">{ws.install.baseDomain}</span>
            </SettingsRow>
          ) : null}
        </SettingsGroup>
        <SettingsGroup title="Danger zone" tone="danger">
          <SettingsRow
            label="Delete this workspace"
            description="Not available from the console: the workspace is an install on your Cloudflare account, removed from there."
          />
        </SettingsGroup>
      </SettingsStack>
    </Page>
  );
}
