import { Badge, Page, SettingsGroup, SettingsRow } from "@forgeron/ui";
import type { PageProps } from "../../../shell/page-props";
import { SettingsStack } from "../components/settings-stack";

export default function ProfilePage({ ws }: PageProps) {
  const { person } = ws;
  return (
    <Page title="Profile" description="How you appear in this workspace.">
      <SettingsStack>
        <SettingsGroup title="You">
          <SettingsRow label="Name" description="Shown to the other members.">
            <span>{person.name}</span>
          </SettingsRow>
          <SettingsRow label="Email" description="The address you sign in with.">
            <span className="fc-mono">{person.email}</span>
          </SettingsRow>
          <SettingsRow
            label="Roles"
            description="What an admin gave you. Ask an admin to change them."
          >
            <span className="fc-badges">
              {person.roles.length ? (
                person.roles.map((role) => (
                  <Badge key={role} tone={role === "admin" ? "strong" : "neutral"}>
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge>no role</Badge>
              )}
            </span>
          </SettingsRow>
        </SettingsGroup>
      </SettingsStack>
    </Page>
  );
}
