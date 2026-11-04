import type { RegisteredEnvironment } from "../../kernel/errors";
import type { Row } from "../../kernel/rows";
import { json, text } from "../../kernel/rows";

export interface Tool {
  id: string;
  workspace: string;
  name: string;
  createdAt: string;
}

export interface BuildRecord {
  id: string;
  toolId: string;
  fingerprint: string;
  manifest: unknown;
  changelog: unknown;
  /** The Worker's code, kept so that a version can be promoted or restored without a rebuild. */
  worker?: string;
  migrations?: unknown;
  createdAt: string;
}

export interface VersionRecord {
  id: string;
  toolId: string;
  buildId: string;
  version: string;
  createdAt: string;
}

export interface EnvironmentRecord {
  id: string;
  toolId: string;
  name: RegisteredEnvironment;
  /** Only a preview has one. */
  branch?: string;
  versionId?: string;
  url?: string;
  activatedAt?: string;
  createdAt: string;
}

export type DeploymentKind = "deploy" | "promote" | "rollback";

/** The commit a deployment was built from, as CI reports it. */
export interface DeploymentCommit {
  sha: string;
  message?: string;
  author?: string;
}

/** One line of the audit log: who put which version on which environment, and when. */
export interface DeploymentRecord {
  id: string;
  toolId: string;
  environmentId: string;
  versionId: string;
  kind: DeploymentKind;
  actor: string;
  /** Only a deployment from CI knows it. */
  commit?: DeploymentCommit;
  createdAt: string;
}

export interface DocFile {
  path: string;
  hash: string;
  type: string;
  size: number;
}

export const toTool = (r: Row): Tool => ({
  id: String(r.id),
  workspace: String(r.workspace),
  name: String(r.name),
  createdAt: String(r.created_at),
});

export const toBuild = (r: Row): BuildRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  fingerprint: String(r.fingerprint),
  manifest: json(r.manifest),
  changelog: json(r.changelog),
  ...(text(r.worker) !== undefined ? { worker: text(r.worker) } : {}),
  ...(text(r.migrations) !== undefined ? { migrations: json(r.migrations) } : {}),
  createdAt: String(r.created_at),
});

export const toVersion = (r: Row): VersionRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  buildId: String(r.build_id),
  version: String(r.version),
  createdAt: String(r.created_at),
});

export const toEnvironment = (r: Row): EnvironmentRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  name: r.name as RegisteredEnvironment,
  ...(r.branch ? { branch: String(r.branch) } : {}),
  ...(text(r.version_id) ? { versionId: text(r.version_id) } : {}),
  ...(text(r.url) ? { url: text(r.url) } : {}),
  ...(text(r.activated_at) ? { activatedAt: text(r.activated_at) } : {}),
  createdAt: String(r.created_at),
});

export const toDeployment = (r: Row): DeploymentRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  environmentId: String(r.environment_id),
  versionId: String(r.version_id),
  kind: r.kind as DeploymentKind,
  actor: String(r.actor),
  ...(text(r.commit_sha)
    ? {
        commit: {
          sha: text(r.commit_sha)!,
          ...(text(r.commit_message) ? { message: text(r.commit_message)! } : {}),
          ...(text(r.commit_author) ? { author: text(r.commit_author)! } : {}),
        },
      }
    : {}),
  createdAt: String(r.created_at),
});
