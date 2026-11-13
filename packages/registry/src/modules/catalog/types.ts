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
  /** The built views, path (`views/pipeline.js`) to code (D-134). */
  views?: Record<string, string>;
  createdAt: string;
}

export interface VersionRecord {
  id: string;
  toolId: string;
  buildId: string;
  version: string;
  /** The branch whose push made it (D-125); none for a marketplace's copy or an older version. */
  branch?: string;
  createdAt: string;
}

export interface EnvironmentRecord {
  id: string;
  toolId: string;
  /**
   * `production` and `channel` are permanent channels; `preview` is a temporary channel, one per
   * branch (D-125).
   */
  name: RegisteredEnvironment;
  /** Only a preview (temporary channel) has one. */
  branch?: string;
  /** Only a permanent channel other than production has one: its name. */
  channel?: string;
  /** The branch a permanent channel other than production follows (production's is the tool's source). */
  follows?: string;
  /** A permanent channel other than production takes a release by itself when it asks for nothing new. */
  autoUpdate?: boolean;
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
  ...(text(r.views) !== undefined ? { views: json(r.views) as Record<string, string> } : {}),
  createdAt: String(r.created_at),
});

export const toVersion = (r: Row): VersionRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  buildId: String(r.build_id),
  version: String(r.version),
  ...(text(r.branch) ? { branch: text(r.branch)! } : {}),
  createdAt: String(r.created_at),
});

export const toEnvironment = (r: Row): EnvironmentRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  name: r.name as RegisteredEnvironment,
  ...(r.branch ? { branch: String(r.branch) } : {}),
  ...(r.channel ? { channel: String(r.channel) } : {}),
  ...(r.name === "channel"
    ? {
        ...(text(r.follows) ? { follows: text(r.follows)! } : {}),
        autoUpdate: Number(r.auto_update) === 1,
      }
    : {}),
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
