import { AccessMatrixEditor } from "../../../access-matrix";
import { knownRoles, loadMembers } from "../../../members";
import { useLoad } from "../../../use-load";
import type { ToolTabProps } from "../tabs";

export default function AccessTab({ tool, api }: ToolTabProps) {
  // The workspace's roles, so that a role the tool has no row for yet can be given something.
  const members = useLoad(() => loadMembers(api.fetchJson), [api]);
  return (
    <AccessMatrixEditor
      tool={tool}
      fetchJson={api.fetchJson}
      sendJson={api.sendJson}
      workspaceRoles={members.data ? knownRoles(members.data) : []}
    />
  );
}
