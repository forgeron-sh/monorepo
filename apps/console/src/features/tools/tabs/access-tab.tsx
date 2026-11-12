import { AccessMatrixEditor } from "../../../access-matrix";
import { knownRoles, loadMembers } from "../../../members";
import { useLoad } from "../../../use-load";
import { loadTeams } from "../../admin/pages/teams";
import type { ToolTabProps } from "../tabs";

export default function AccessTab({ tool, api }: ToolTabProps) {
  // The workspace's roles and teams, so that one the tool has no row for yet can be given something.
  // A team is a subject like a role, named `team-<id>` (D-132).
  const members = useLoad(() => loadMembers(api.fetchJson), [api]);
  const teams = useLoad(() => loadTeams(api.fetchJson).catch(() => []), [api]);
  return (
    <AccessMatrixEditor
      tool={tool}
      fetchJson={api.fetchJson}
      sendJson={api.sendJson}
      workspaceRoles={[
        ...(members.data ? knownRoles(members.data) : []),
        ...(teams.data ?? []).map((t) => t.role),
      ]}
    />
  );
}
