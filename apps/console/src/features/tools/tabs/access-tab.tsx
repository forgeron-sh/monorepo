import { AccessMatrixEditor } from "../../../access-matrix";
import type { ToolTabProps } from "../tabs";

export default function AccessTab({ tool, api }: ToolTabProps) {
  return <AccessMatrixEditor tool={tool} fetchJson={api.fetchJson} sendJson={api.sendJson} />;
}
