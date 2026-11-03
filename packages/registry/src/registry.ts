// The typed access layer over the platform D1. Plain SQL on the small D1 surface that `hosting`
// already defines, so the gateway, a script and a test all use it. Every write is one statement or
// one batch (D-012).
import type { D1Database, EnvironmentName } from "@forgeron/hosting";

export type RegisteredEnvironment = Exclude<EnvironmentName, "local">;
export type ApprovalStatus = "pending" | "approved" | "rejected";

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

export interface Approval {
  id: string;
  toolId: string;
  versionId: string;
  resource: string;
  kind: string;
  status: ApprovalStatus;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

export type RegistryErrorCode =
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "ALREADY_DECIDED"
  | "BRANCH_REQUIRED"
  | "WRONG_TOOL";

export class RegistryError extends Error {
  override name = "RegistryError";
  readonly code: RegistryErrorCode;
  constructor(code: RegistryErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface RegistryOptions {
  now?: () => Date;
  newId?: () => string;
}

type Row = Record<string, unknown>;

const text = (value: unknown) =>
  value === null || value === undefined ? undefined : String(value);
const json = (value: unknown) =>
  typeof value === "string" ? (JSON.parse(value) as unknown) : null;

const toTool = (r: Row): Tool => ({
  id: String(r.id),
  workspace: String(r.workspace),
  name: String(r.name),
  createdAt: String(r.created_at),
});
const toBuild = (r: Row): BuildRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  fingerprint: String(r.fingerprint),
  manifest: json(r.manifest),
  changelog: json(r.changelog),
  createdAt: String(r.created_at),
});
const toVersion = (r: Row): VersionRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  buildId: String(r.build_id),
  version: String(r.version),
  createdAt: String(r.created_at),
});
const toEnvironment = (r: Row): EnvironmentRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  name: r.name as RegisteredEnvironment,
  ...(r.branch ? { branch: String(r.branch) } : {}),
  ...(text(r.version_id) ? { versionId: text(r.version_id) } : {}),
  ...(text(r.url) ? { url: text(r.url) } : {}),
  ...(text(r.activated_at) ? { activatedAt: text(r.activated_at) } : {}),
  createdAt: String(r.created_at),
});
const toApproval = (r: Row): Approval => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  versionId: String(r.version_id),
  resource: String(r.resource),
  kind: String(r.kind),
  status: r.status as ApprovalStatus,
  requestedAt: String(r.requested_at),
  ...(text(r.decided_by) ? { decidedBy: text(r.decided_by) } : {}),
  ...(text(r.decided_at) ? { decidedAt: text(r.decided_at) } : {}),
});

export function createRegistry(d1: D1Database, options: RegistryOptions = {}) {
  const now = () => (options.now?.() ?? new Date()).toISOString();
  const newId = options.newId ?? (() => crypto.randomUUID());

  const all = async (sql: string, ...values: unknown[]): Promise<Row[]> =>
    ((
      await d1
        .prepare(sql)
        .bind(...values)
        .all()
    ).results ?? []) as Row[];
  const first = async (sql: string, ...values: unknown[]) => (await all(sql, ...values))[0];
  const write = (sql: string, ...values: unknown[]) => d1.batch([d1.prepare(sql).bind(...values)]);

  async function requireTool(id: string): Promise<Tool> {
    const row = await first(`SELECT * FROM "tools" WHERE "id" = ?`, id);
    if (!row) throw new RegistryError("NOT_FOUND", `There is no tool ${id}.`);
    return toTool(row);
  }

  return {
    // ---- tools
    async createTool(input: { workspace: string; name: string }): Promise<Tool> {
      if (await this.findTool(input.workspace, input.name)) {
        throw new RegistryError(
          "ALREADY_EXISTS",
          `The workspace ${input.workspace} already has a tool ${input.name}.`,
        );
      }
      const id = newId();
      await write(
        `INSERT INTO "tools" ("id", "workspace", "name", "created_at") VALUES (?, ?, ?, ?)`,
        id,
        input.workspace,
        input.name,
        now(),
      );
      return requireTool(id);
    },
    async findTool(workspace: string, name: string): Promise<Tool | undefined> {
      const row = await first(
        `SELECT * FROM "tools" WHERE "workspace" = ? AND "name" = ?`,
        workspace,
        name,
      );
      return row ? toTool(row) : undefined;
    },
    async listTools(workspace: string): Promise<Tool[]> {
      return (
        await all(`SELECT * FROM "tools" WHERE "workspace" = ? ORDER BY "name"`, workspace)
      ).map(toTool);
    },
    /** Deletes the tool with its builds, versions, environments and approvals. */
    async deleteTool(id: string): Promise<void> {
      await requireTool(id);
      await write(`DELETE FROM "tools" WHERE "id" = ?`, id);
    },

    // ---- builds
    /** Records what CI sent. The same fingerprint gives back the build already recorded. */
    async recordBuild(
      toolId: string,
      input: { fingerprint: string; manifest: unknown; changelog?: unknown },
    ): Promise<BuildRecord> {
      await requireTool(toolId);
      const existing = await first(
        `SELECT * FROM "builds" WHERE "tool_id" = ? AND "fingerprint" = ?`,
        toolId,
        input.fingerprint,
      );
      if (existing) return toBuild(existing);
      const id = newId();
      await write(
        `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "changelog", "created_at") VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        toolId,
        input.fingerprint,
        JSON.stringify(input.manifest),
        input.changelog === undefined ? null : JSON.stringify(input.changelog),
        now(),
      );
      return toBuild((await first(`SELECT * FROM "builds" WHERE "id" = ?`, id))!);
    },
    async getBuild(id: string): Promise<BuildRecord | undefined> {
      const row = await first(`SELECT * FROM "builds" WHERE "id" = ?`, id);
      return row ? toBuild(row) : undefined;
    },

    // ---- versions
    /** Publishes a build under a version number. A version number is used once per tool. */
    async publishVersion(toolId: string, buildId: string, version: string): Promise<VersionRecord> {
      const build = await this.getBuild(buildId);
      if (!build) throw new RegistryError("NOT_FOUND", `There is no build ${buildId}.`);
      if (build.toolId !== toolId) {
        throw new RegistryError("WRONG_TOOL", `The build ${buildId} belongs to another tool.`);
      }
      if (
        await first(
          `SELECT 1 FROM "versions" WHERE "tool_id" = ? AND "version" = ?`,
          toolId,
          version,
        )
      ) {
        throw new RegistryError("ALREADY_EXISTS", `The tool already has a version ${version}.`);
      }
      const id = newId();
      await write(
        `INSERT INTO "versions" ("id", "tool_id", "build_id", "version", "created_at") VALUES (?, ?, ?, ?, ?)`,
        id,
        toolId,
        buildId,
        version,
        now(),
      );
      return toVersion((await first(`SELECT * FROM "versions" WHERE "id" = ?`, id))!);
    },
    async getVersion(id: string): Promise<VersionRecord | undefined> {
      const row = await first(`SELECT * FROM "versions" WHERE "id" = ?`, id);
      return row ? toVersion(row) : undefined;
    },
    /** Oldest first, in the order they were published. */
    async listVersions(toolId: string): Promise<VersionRecord[]> {
      return (
        await all(
          `SELECT * FROM "versions" WHERE "tool_id" = ? ORDER BY "created_at", "rowid"`,
          toolId,
        )
      ).map(toVersion);
    },

    // ---- environments
    /** The environment of a tool, created if needed. A preview needs its branch; the others have none. */
    async ensureEnvironment(
      toolId: string,
      name: RegisteredEnvironment,
      branch?: string,
    ): Promise<EnvironmentRecord> {
      await requireTool(toolId);
      if (name === "preview" && !branch) {
        throw new RegistryError("BRANCH_REQUIRED", "A preview environment is tied to a branch.");
      }
      const key = name === "preview" ? branch! : "";
      const found = await first(
        `SELECT * FROM "environments" WHERE "tool_id" = ? AND "name" = ? AND "branch" = ?`,
        toolId,
        name,
        key,
      );
      if (found) return toEnvironment(found);
      const id = newId();
      await write(
        `INSERT INTO "environments" ("id", "tool_id", "name", "branch", "created_at") VALUES (?, ?, ?, ?, ?)`,
        id,
        toolId,
        name,
        key,
        now(),
      );
      return toEnvironment((await first(`SELECT * FROM "environments" WHERE "id" = ?`, id))!);
    },
    async listEnvironments(toolId: string): Promise<EnvironmentRecord[]> {
      return (
        await all(
          `SELECT * FROM "environments" WHERE "tool_id" = ? ORDER BY "name", "branch"`,
          toolId,
        )
      ).map(toEnvironment);
    },
    /** Records that the environment serves this version (the traffic switch itself is `hosting`'s). */
    async activate(
      environmentId: string,
      versionId: string,
      url?: string,
    ): Promise<EnvironmentRecord> {
      const env = await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId);
      if (!env) throw new RegistryError("NOT_FOUND", `There is no environment ${environmentId}.`);
      const version = await this.getVersion(versionId);
      if (!version) throw new RegistryError("NOT_FOUND", `There is no version ${versionId}.`);
      if (version.toolId !== String(env.tool_id)) {
        throw new RegistryError("WRONG_TOOL", "The version belongs to another tool.");
      }
      await write(
        `UPDATE "environments" SET "version_id" = ?, "url" = ?, "activated_at" = ? WHERE "id" = ?`,
        versionId,
        url ?? null,
        now(),
        environmentId,
      );
      return toEnvironment(
        (await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId))!,
      );
    },
    /** Forgets an environment (a preview whose branch is gone). */
    async removeEnvironment(environmentId: string): Promise<void> {
      await write(`DELETE FROM "environments" WHERE "id" = ?`, environmentId);
    },

    // ---- approvals
    /** A version asks for a resource. Asking again gives back the same request. */
    async requestApproval(
      versionId: string,
      input: { resource: string; kind: string },
    ): Promise<Approval> {
      const version = await this.getVersion(versionId);
      if (!version) throw new RegistryError("NOT_FOUND", `There is no version ${versionId}.`);
      const found = await first(
        `SELECT * FROM "approvals" WHERE "version_id" = ? AND "resource" = ?`,
        versionId,
        input.resource,
      );
      if (found) return toApproval(found);
      const id = newId();
      await write(
        `INSERT INTO "approvals" ("id", "tool_id", "version_id", "resource", "kind", "requested_at") VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        version.toolId,
        versionId,
        input.resource,
        input.kind,
        now(),
      );
      return toApproval((await first(`SELECT * FROM "approvals" WHERE "id" = ?`, id))!);
    },
    /** Decides a pending request, once. */
    async decideApproval(
      id: string,
      decision: Exclude<ApprovalStatus, "pending">,
      decidedBy: string,
    ): Promise<Approval> {
      const row = await first(`SELECT * FROM "approvals" WHERE "id" = ?`, id);
      if (!row) throw new RegistryError("NOT_FOUND", `There is no approval ${id}.`);
      if (row.status !== "pending") {
        throw new RegistryError(
          "ALREADY_DECIDED",
          `The approval ${id} is already ${String(row.status)}.`,
        );
      }
      await write(
        `UPDATE "approvals" SET "status" = ?, "decided_by" = ?, "decided_at" = ? WHERE "id" = ? AND "status" = 'pending'`,
        decision,
        decidedBy,
        now(),
        id,
      );
      return toApproval((await first(`SELECT * FROM "approvals" WHERE "id" = ?`, id))!);
    },
    async listApprovals(toolId: string, status?: ApprovalStatus): Promise<Approval[]> {
      const rows = status
        ? await all(
            `SELECT * FROM "approvals" WHERE "tool_id" = ? AND "status" = ? ORDER BY "requested_at", "rowid"`,
            toolId,
            status,
          )
        : await all(
            `SELECT * FROM "approvals" WHERE "tool_id" = ? ORDER BY "requested_at", "rowid"`,
            toolId,
          );
      return rows.map(toApproval);
    },
    /** The resources of this version that are not approved yet: what blocks an activation. */
    async unapproved(versionId: string): Promise<Approval[]> {
      return (
        await all(
          `SELECT * FROM "approvals" WHERE "version_id" = ? AND "status" != 'approved' ORDER BY "rowid"`,
          versionId,
        )
      ).map(toApproval);
    },
  };
}

export type Registry = ReturnType<typeof createRegistry>;
