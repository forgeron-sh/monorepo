import { Badge, EmptyState, Page, SettingsGroup, SettingsRow } from "@forgeron/ui";
import { loadMembers, knownRoles } from "../../../members";
import type { PageProps } from "../../../shell/page-props";
import { LoadError, Loading } from "../../../states";
import { loadTools } from "../../tools/api";
import { useLoad } from "../../../use-load";
import { SettingsStack } from "../components/settings-stack";

const count = (n: number, what: string) => `${n} ${what}${n === 1 ? "" : "s"}`;

export default function RolesPage({ api, go }: PageProps) {
  const members = useLoad(() => loadMembers(api.fetchJson), [api]);
  const tools = useLoad(() => loadTools(api.fetchJson), [api]);
  const view = members.data;
  return (
    <Page
      title="Roles and access"
      description="Who holds which role, and where each tool says what a role may do."
    >
      {members.loading || tools.loading ? (
        <Loading label="Loading roles" />
      ) : !view ? (
        <LoadError what="The roles" error={members.error} onRetry={members.reload} />
      ) : (
        <SettingsStack>
          <SettingsGroup
            title="Roles"
            description="Roles come from your members and from the tools. Change who holds one on the members page."
          >
            {knownRoles(view).map((role) => {
              const holders = view.members.filter((m) => m.roles.includes(role)).length;
              return (
                <SettingsRow
                  key={role}
                  label={<span className="fc-mono">{role}</span>}
                  description={
                    role === "admin" ? "Manages the workspace and every tool." : undefined
                  }
                  href="/settings/members"
                  value={count(holders, "member")}
                  onNavigate={(href) => go(href)}
                />
              );
            })}
          </SettingsGroup>
          <SettingsGroup
            title="Access by tool"
            description="Each tool has a matrix of its actions by role."
          >
            {tools.data?.length ? (
              tools.data.map((tool) => (
                <SettingsRow
                  key={tool.name}
                  label={<span className="fc-mono">{tool.name}</span>}
                  href={`/tools/${encodeURIComponent(tool.name)}`}
                  onNavigate={(href) => go(href)}
                  value={<Badge>Access matrix</Badge>}
                />
              ))
            ) : (
              <EmptyState
                title="No tool yet"
                description="Deploy a tool to set who may use its actions."
              />
            )}
          </SettingsGroup>
        </SettingsStack>
      )}
    </Page>
  );
}
