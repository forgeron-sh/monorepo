// The typed access layer over the platform D1. Plain SQL on the small D1 surface that `hosting`
// already defines, so the gateway, a script and a test all use it. Every write is one statement or
// one batch (D-012).
import type { D1Database, EnvironmentName } from "@forgeron/hosting";
import type { SecretBox } from "./secret-box";

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
  /** Pilot only: the group that gets this version at the production address. */
  pilotGroup?: string;
  createdAt: string;
}

export type DeploymentKind = "deploy" | "promote" | "rollback";

/** One line of the audit log: who put which version on which environment, and when. */
export interface DeploymentRecord {
  id: string;
  toolId: string;
  environmentId: string;
  versionId: string;
  kind: DeploymentKind;
  actor: string;
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
  | "WRONG_TOOL"
  | "NO_ARTIFACT"
  | "NO_PREVIOUS"
  | "NO_SECRET_KEY";

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
  /** Encrypts tool secrets at rest; without it the secret methods refuse to run. */
  secrets?: SecretBox;
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
  ...(text(r.worker) !== undefined ? { worker: text(r.worker) } : {}),
  ...(text(r.migrations) !== undefined ? { migrations: json(r.migrations) } : {}),
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
  ...(text(r.pilot_group) ? { pilotGroup: text(r.pilot_group) } : {}),
  createdAt: String(r.created_at),
});
const toDeployment = (r: Row): DeploymentRecord => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  environmentId: String(r.environment_id),
  versionId: String(r.version_id),
  kind: r.kind as DeploymentKind,
  actor: String(r.actor),
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

  const secretBox = (): SecretBox => {
    if (!options.secrets) {
      throw new RegistryError(
        "NO_SECRET_KEY",
        "The registry has no secret key: it cannot keep secrets.",
      );
    }
    return options.secrets;
  };
  const slot = (toolId: string, environment: string, name: string) =>
    `${toolId}/${environment}/${name}`;

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

    // ---- secrets (resources.secrets: set by the admin, per tool and environment, encrypted)
    /** Sets or replaces a secret. The value is encrypted before it reaches the database. */
    async setSecret(
      toolId: string,
      environment: RegisteredEnvironment,
      name: string,
      value: string,
    ): Promise<void> {
      await requireTool(toolId);
      const sealed = await secretBox().seal(slot(toolId, environment, name), value);
      await write(
        `INSERT INTO "secrets" ("tool_id", "environment", "name", "iv", "ciphertext", "updated_at")
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT ("tool_id", "environment", "name")
DO UPDATE SET "iv" = excluded."iv", "ciphertext" = excluded."ciphertext", "updated_at" = excluded."updated_at"`,
        toolId,
        environment,
        name,
        sealed.iv,
        sealed.ciphertext,
        now(),
      );
    },
    /** The names of the secrets that are set, never their values. */
    async secretNames(toolId: string, environment: RegisteredEnvironment): Promise<string[]> {
      return (
        await all(
          `SELECT "name" FROM "secrets" WHERE "tool_id" = ? AND "environment" = ? ORDER BY "name"`,
          toolId,
          environment,
        )
      ).map((r) => String(r.name));
    },
    async deleteSecret(
      toolId: string,
      environment: RegisteredEnvironment,
      name: string,
    ): Promise<void> {
      await write(
        `DELETE FROM "secrets" WHERE "tool_id" = ? AND "environment" = ? AND "name" = ?`,
        toolId,
        environment,
        name,
      );
    },
    /** The decrypted secrets of an environment: for the runtime's `ctx.secrets`, never for a person. */
    async readSecrets(
      toolId: string,
      environment: RegisteredEnvironment,
    ): Promise<Record<string, string>> {
      const box = secretBox();
      const out: Record<string, string> = {};
      for (const r of await all(
        `SELECT "name", "iv", "ciphertext" FROM "secrets" WHERE "tool_id" = ? AND "environment" = ?`,
        toolId,
        environment,
      )) {
        const name = String(r.name);
        out[name] = await box.open(slot(toolId, environment, name), {
          iv: String(r.iv),
          ciphertext: String(r.ciphertext),
        });
      }
      return out;
    },

    // ---- builds
    /** Records what CI sent. The same fingerprint gives back the build already recorded. */
    async recordBuild(
      toolId: string,
      input: {
        fingerprint: string;
        manifest: unknown;
        changelog?: unknown;
        worker?: string;
        migrations?: unknown;
      },
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
        `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "changelog", "worker", "migrations", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        toolId,
        input.fingerprint,
        JSON.stringify(input.manifest),
        input.changelog === undefined ? null : JSON.stringify(input.changelog),
        input.worker ?? null,
        input.migrations === undefined ? null : JSON.stringify(input.migrations),
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
    /**
     * Records that the environment serves this version, and writes the line of the audit log, in
     * one batch (the traffic switch itself is `hosting`'s).
     */
    async activate(
      environmentId: string,
      versionId: string,
      options: { actor: string; kind?: DeploymentKind; url?: string },
    ): Promise<EnvironmentRecord> {
      const env = await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId);
      if (!env) throw new RegistryError("NOT_FOUND", `There is no environment ${environmentId}.`);
      const version = await this.getVersion(versionId);
      if (!version) throw new RegistryError("NOT_FOUND", `There is no version ${versionId}.`);
      if (version.toolId !== String(env.tool_id)) {
        throw new RegistryError("WRONG_TOOL", "The version belongs to another tool.");
      }
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `UPDATE "environments" SET "version_id" = ?, "url" = ?, "activated_at" = ? WHERE "id" = ?`,
          )
          .bind(versionId, options.url ?? null, at, environmentId),
        d1
          .prepare(
            `INSERT INTO "deployments" ("id", "tool_id", "environment_id", "version_id", "kind", "actor", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            version.toolId,
            environmentId,
            versionId,
            options.kind ?? "deploy",
            options.actor,
            at,
          ),
      ]);
      return toEnvironment(
        (await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId))!,
      );
    },
    /** The audit log of an environment, oldest first. */
    async history(environmentId: string): Promise<DeploymentRecord[]> {
      return (
        await all(
          `SELECT * FROM "deployments" WHERE "environment_id" = ? ORDER BY "rowid"`,
          environmentId,
        )
      ).map(toDeployment);
    },
    /** The version the environment served before the current one: the latest one that is not it. */
    async previousVersion(environmentId: string): Promise<VersionRecord | undefined> {
      const env = await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId);
      if (!env) throw new RegistryError("NOT_FOUND", `There is no environment ${environmentId}.`);
      const row = await first(
        `SELECT "version_id" FROM "deployments" WHERE "environment_id" = ? AND "version_id" != ? ORDER BY "rowid" DESC LIMIT 1`,
        environmentId,
        text(env.version_id) ?? "",
      );
      return row ? this.getVersion(String(row.version_id)) : undefined;
    },
    async findVersion(toolId: string, version: string): Promise<VersionRecord | undefined> {
      const row = await first(
        `SELECT * FROM "versions" WHERE "tool_id" = ? AND "version" = ?`,
        toolId,
        version,
      );
      return row ? toVersion(row) : undefined;
    },
    /** Sets, or with `undefined` clears, the group that gets the pilot version. */
    async setPilotGroup(
      environmentId: string,
      group: string | undefined,
    ): Promise<EnvironmentRecord> {
      const env = await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId);
      if (!env) throw new RegistryError("NOT_FOUND", `There is no environment ${environmentId}.`);
      await write(
        `UPDATE "environments" SET "pilot_group" = ? WHERE "id" = ?`,
        group ?? null,
        environmentId,
      );
      return toEnvironment(
        (await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId))!,
      );
    },
    /**
     * The environment that answers someone at the production address: the pilot if it serves a
     * version and the person is in its group, production otherwise.
     */
    async servedFor(
      toolId: string,
      groups: readonly string[],
    ): Promise<EnvironmentRecord | undefined> {
      const environments = await this.listEnvironments(toolId);
      const pilot = environments.find((e) => e.name === "pilot");
      if (pilot?.versionId && pilot.pilotGroup && groups.includes(pilot.pilotGroup)) return pilot;
      return environments.find((e) => e.name === "production" && e.versionId);
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
