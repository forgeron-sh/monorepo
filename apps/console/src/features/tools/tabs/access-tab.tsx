import { AccessMatrixEditor } from "../../../access-matrix";
import { can } from "../../../shell/access";
import type { ToolTabProps } from "../tabs";

// The Access tab: who may use the tool, Everyone and each team by name (D-137). Seen with
// `access:read`, changed with `access:write`.
export default function AccessTab({ tool, api, ws }: ToolTabProps) {
  return (
    <AccessMatrixEditor
      tool={tool}
      fetchJson={api.fetchJson}
      sendJson={api.sendJson}
      readOnly={!can(ws.person, "access:write")}
    />
  );
}
