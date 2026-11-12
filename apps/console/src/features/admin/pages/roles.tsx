import { Badge, EmptyState, Page, SettingsGroup, SettingsRow } from "@forgeron/ui";
import { loadMembers, knownRoles } from "../../../members";
import type { PageProps } from "../../../shell/page-props";
import { LoadError, Loading } from "../../../states";
import { toolPath, pathOf } from "../../../router";
import { loadTools } from "../../tools/api";
import { useLoad } from "../../../use-load";

const count = (n: number, what: string) => `${n} ${what}${n === 1 ? "" : "s"}`;

export default function RolesPage({ api, go }: PageProps) {
  const members = useLoad(() => loadMembers(api.fetchJson), [api]);
  const tools = useLoad(() => loadTools(api.fetchJson), [api]);
  const view = members.data;
  return (
    <Page
      title="Roles and access"
      description="Who holds which role, and where each tool says what a role is given."
    >
      {members.loading || tools.loading ? (
        <Loading shape="table" label="Loading roles" />
      ) : !view ? (
        <LoadError what="The roles" error={members.error} onRetry={members.reload} />
      ) : (
        <div className="fc-settings">
          <SettingsGroup
            title="Roles"
            description="Roles belong to the workspace: tools never add any. Everyone holds member; change who holds the others on the members page."
          >
            {knownRoles(view).map((role) => {
              // Everyone holds `member` without being given it (D-128).
              const holders =
                role === "member"
                  ? view.members.length
                  : view.members.filter((m) => m.roles.includes(role)).length;
              return (
                <SettingsRow
                  key={role}
                  label={<span className="fc-mono">{role}</span>}
                  description={
                    role === "admin"
                      ? "Manages the workspace; every permission of a new tool."
                      : role === "member"
                        ? "Everyone in the workspace; the default profile of a new tool."
                        : undefined
                  }
                  href={pathOf("members")}
                  value={count(holders, "member")}
                  onNavigate={(href) => go(href)}
                />
              );
            })}
          </SettingsGroup>
          <SettingsGroup
            title="Access by tool"
            description="Each tool maps the workspace roles to its profiles, in its Access tab."
          >
            {tools.data?.length ? (
              tools.data.map((tool) => (
                <SettingsRow
                  key={tool.name}
                  label={<span className="fc-mono">{tool.name}</span>}
                  href={`${toolPath(tool.name)}?tab=access`}
                  onNavigate={(href) => go(href)}
                  value={<Badge>Access</Badge>}
                />
              ))
            ) : (
              <EmptyState
                title="No tool yet"
                description="Deploy a tool to set who may use its actions."
              />
            )}
          </SettingsGroup>
        </div>
      )}
    </Page>
  );
}
