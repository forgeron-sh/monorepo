/** The workspace that holds the template catalogue. Not a workspace name (`@` is no part of an address). */
export const TEMPLATE_WORKSPACE = "@templates";

/** A template of the catalogue: the latest version published under its name. */
export interface Template {
  name: string;
  version: string;
  /** What the version asks for (`resources.db`, `resources.network`…): what an admin will approve. */
  resources: string[];
}

export interface InstalledTemplate {
  /** The tool created in the workspace: same name as the template (its manifest names it). */
  tool: { id: string; name: string };
  version: { id: string; version: string };
  /** The requests an admin still has to decide before the tool can reach production. */
  approvals: Array<{ resource: string; kind: string }>;
}
