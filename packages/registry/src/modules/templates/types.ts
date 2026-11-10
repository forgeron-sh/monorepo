import type { Manifest } from "@forgeron/manifest";

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

/** What an install plan shows before anything is created (D-092). */
export interface InstallPlan {
  /** The identifier `tool_install` accepts: single-use, bound to the person and the workspace. */
  id: string;
  template: string;
  version: string;
  /** What an admin will have to approve (`resources.db`, `resources.network`…). */
  resources: string[];
  expiresAt: string;
}

/** Why a plan cannot be used. `unknown` covers a plan that does not exist, is another person's or another workspace's. */
export type InstallPlanRefusal = "unknown" | "used" | "expired" | "stale";

/** One tool of a catalogue as an admin reads it before installing (D-116). */
export interface DescribedTemplate {
  name: string;
  version: string;
  publishedAt: string;
  manifest: Manifest;
  resources: string[];
  readme?: string;
  guide?: string;
  changelog: unknown[];
}

/** Where a tool comes from (D-121). */
export interface ToolSource {
  /** `marketplace`: installed from a catalogue; `repo`: deployed by a repository's CI. */
  kind: "marketplace" | "repo";
  /** The catalogue (`@templates`, `@mp:<id>`), for a marketplace tool. */
  source?: string;
  /** The tool's name in that catalogue. */
  sourceTool?: string;
  /** `owner/name`, for a repository tool: shown, never called. */
  repo?: string;
  /** The branch whose preview is the candidate for production (a repository tool). */
  productionBranch: string;
  /** A new version goes to production by itself when it asks for nothing new. */
  autoUpdate: boolean;
  /** False for a tool deployed before sources: what is shown is the default. */
  recorded: boolean;
}

/** The version a tool could move to, from its source. */
export interface AvailableUpdate {
  version: string;
  /** For a repository tool: the branch it is served from. */
  branch?: string;
}
