// The typed access layer over the platform D1. Plain SQL on the small D1 surface that `hosting`
// already defines, so the gateway, a script and a test all use it. Every write is one statement or
// one batch (D-012).
import type { D1Database, EnvironmentName } from "@forgeron/hosting";
import type { Manifest } from "@forgeron/manifest";
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

export interface AccessCell {
  /** What the role's levels say for this action. */
  default: boolean;
  /** What an admin set in the console, if anything. */
  override?: boolean;
  /** What applies: the override, else the default. */
  allowed: boolean;
}

/** The matrix of a tool: for each role, for each action, whether it may call it. */
export interface AccessMatrix {
  roles: string[];
  actions: string[];
  cells: Record<string, Record<string, AccessCell>>;
}

export type AuditKind = "action" | "deployment" | "promotion" | "rollback" | "approval";
export type AuditResult = "ok" | "denied" | "error";
export type AuditInterface = "mcp" | "api" | "cli" | "web";

/** What the admin MCP writes in `via`: its calls are the person's, made through Forgeron's MCP. */
export const VIA_FORGERON_MCP = "Forgeron MCP";

export interface AuditEntry {
  toolId?: string;
  /** Who: a person's id. */
  actor: string;
  /** Through which interface an action was called. */
  interface?: AuditInterface;
  /** `VIA_FORGERON_MCP` for the admin MCP. */
  via?: string;
  kind: AuditKind;
  /** The action called, the resource approved, the version deployed. */
  subject: string;
  versionId?: string;
  result?: AuditResult;
  detail?: unknown;
}

export interface AuditRecord extends Omit<AuditEntry, "result"> {
  id: string;
  at: string;
  result: AuditResult;
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

export type SecretState = "set" | "missing";

/** One secret the tool declares, and whether each environment has it. Never a value. */
export interface SecretStatus {
  name: string;
  environments: Record<RegisteredEnvironment, SecretState>;
}

/** The tokens of one person's consent. Sealed in the database, never returned to a person. */
export interface ConnectionTokens {
  accessToken: string;
  refreshToken?: string;
}

/** What is known about a consent without its tokens: what the person and the admin may see. */
export interface ConnectionInfo {
  userId: string;
  connector: string;
  scopes: string[];
  /** When the access token expires, if the provider said. */
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type RegistryErrorCode =
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "ALREADY_DECIDED"
  | "BRANCH_REQUIRED"
  | "WRONG_TOOL"
  | "NO_ARTIFACT"
  | "NO_PREVIOUS"
  | "NO_SECRET_KEY"
  | "PENDING_APPROVAL"
  | "NO_MANIFEST";

export class RegistryError extends Error {
  override name = "RegistryError";
  readonly code: RegistryErrorCode;
  constructor(code: RegistryErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const DEPLOYMENT_AUDIT: Record<DeploymentKind, AuditKind> = {
  deploy: "deployment",
  promote: "promotion",
  rollback: "rollback",
};

/** A person of a workspace; `subject` is their id at the identity provider. */
export interface Member {
  workspace: string;
  id: string;
  subject: string;
  email: string;
  name: string;
  roles: string[];
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
const toAudit = (r: Row): AuditRecord => ({
  id: String(r.id),
  at: String(r.at),
  ...(text(r.tool_id) ? { toolId: text(r.tool_id) } : {}),
  actor: String(r.actor),
  ...(text(r.interface) ? { interface: text(r.interface) as AuditInterface } : {}),
  ...(text(r.via) ? { via: text(r.via) } : {}),
  kind: r.kind as AuditKind,
  subject: String(r.subject),
  ...(text(r.version_id) ? { versionId: text(r.version_id) } : {}),
  result: r.result as AuditResult,
  ...(text(r.detail) !== undefined ? { detail: json(r.detail) } : {}),
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

const toMember = (r: Row): Member => ({
  workspace: String(r.workspace),
  id: String(r.id),
  subject: String(r.subject),
  email: String(r.email),
  name: String(r.name),
  roles: json(r.roles) as string[],
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

  const auditStatement = (entry: AuditEntry, at: string) =>
    d1
      .prepare(
        `INSERT INTO "audit_log" ("id", "at", "tool_id", "actor", "interface", "via", "kind", "subject", "version_id", "result", "detail") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newId(),
        at,
        entry.toolId ?? null,
        entry.actor,
        entry.interface ?? null,
        entry.via ?? null,
        entry.kind,
        entry.subject,
        entry.versionId ?? null,
        entry.result ?? "ok",
        entry.detail === undefined ? null : JSON.stringify(entry.detail),
      );

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

  const userSlot = (toolId: string, person: string, name: string) =>
    `user/${toolId}/${person}/${name}`;

  const connectionSlot = (c: {
    toolId: string;
    environment: string;
    userId: string;
    connector: string;
  }) => `connection/${c.toolId}/${c.environment}/${c.userId}/${c.connector}`;

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
    /**
     * The secrets the tool declares (`resources.secrets` of its latest published version) and,
     * for each environment, whether it is set or missing. The same answer feeds the console and
     * the admin MCP's `secrets_status`.
     */
    async secretsStatus(toolId: string): Promise<SecretStatus[]> {
      await requireTool(toolId);
      const latest = (await this.listVersions(toolId)).at(-1);
      const build = latest ? await this.getBuild(latest.buildId) : undefined;
      const declared = Object.keys(
        (build?.manifest as { resources?: { secrets?: Record<string, unknown> } } | null)?.resources
          ?.secrets ?? {},
      ).sort();
      const set = {
        preview: new Set(await this.secretNames(toolId, "preview")),
        pilot: new Set(await this.secretNames(toolId, "pilot")),
        production: new Set(await this.secretNames(toolId, "production")),
      };
      const state = (env: RegisteredEnvironment, name: string): SecretState =>
        set[env].has(name) ? "set" : "missing";
      return declared.map((name) => ({
        name,
        environments: {
          preview: state("preview", name),
          pilot: state("pilot", name),
          production: state("production", name),
        },
      }));
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

    // ---- connections (a person's OAuth consent for a delegated connector, tokens sealed)
    /** Keeps or replaces a person's consent. The tokens are encrypted before the database. */
    async saveConnection(input: {
      toolId: string;
      environment: RegisteredEnvironment;
      userId: string;
      connector: string;
      scopes: string[];
      tokens: ConnectionTokens;
      expiresAt?: string;
    }): Promise<void> {
      await requireTool(input.toolId);
      const sealed = await secretBox().seal(connectionSlot(input), JSON.stringify(input.tokens));
      const at = now();
      await write(
        `INSERT INTO "connections" ("tool_id", "environment", "user_id", "connector", "scopes", "expires_at", "iv", "ciphertext", "created_at", "updated_at")
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT ("tool_id", "environment", "user_id", "connector")
DO UPDATE SET "scopes" = excluded."scopes", "expires_at" = excluded."expires_at", "iv" = excluded."iv", "ciphertext" = excluded."ciphertext", "updated_at" = excluded."updated_at"`,
        input.toolId,
        input.environment,
        input.userId,
        input.connector,
        JSON.stringify(input.scopes),
        input.expiresAt ?? null,
        sealed.iv,
        sealed.ciphertext,
        at,
        at,
      );
    },
    /** The consents of a tool's environment, for the admin: who consented to what, never a token. */
    async listConnections(
      toolId: string,
      environment: RegisteredEnvironment,
      filter: { userId?: string } = {},
    ): Promise<ConnectionInfo[]> {
      const rows = await all(
        `SELECT "user_id", "connector", "scopes", "expires_at", "created_at", "updated_at" FROM "connections"
WHERE "tool_id" = ? AND "environment" = ? ${filter.userId === undefined ? "" : 'AND "user_id" = ?'}
ORDER BY "user_id", "connector"`,
        toolId,
        environment,
        ...(filter.userId === undefined ? [] : [filter.userId]),
      );
      return rows.map((r) => ({
        userId: String(r.user_id),
        connector: String(r.connector),
        scopes: JSON.parse(String(r.scopes)) as string[],
        ...(text(r.expires_at) ? { expiresAt: text(r.expires_at) } : {}),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      }));
    },
    /** The admin revokes a person's consent (or the person withdraws it). True if there was one. */
    async revokeConnection(input: {
      toolId: string;
      environment: RegisteredEnvironment;
      userId: string;
      connector: string;
    }): Promise<boolean> {
      const existed = await first(
        `SELECT 1 AS found FROM "connections" WHERE "tool_id" = ? AND "environment" = ? AND "user_id" = ? AND "connector" = ?`,
        input.toolId,
        input.environment,
        input.userId,
        input.connector,
      );
      await write(
        `DELETE FROM "connections" WHERE "tool_id" = ? AND "environment" = ? AND "user_id" = ? AND "connector" = ?`,
        input.toolId,
        input.environment,
        input.userId,
        input.connector,
      );
      return existed !== undefined;
    },
    /** The decrypted tokens, for the connector's session at run time: never for a person or the admin. */
    async readConnection(input: {
      toolId: string;
      environment: RegisteredEnvironment;
      userId: string;
      connector: string;
    }): Promise<(ConnectionTokens & { expiresAt?: string; scopes: string[] }) | undefined> {
      const row = await first(
        `SELECT "scopes", "expires_at", "iv", "ciphertext" FROM "connections" WHERE "tool_id" = ? AND "environment" = ? AND "user_id" = ? AND "connector" = ?`,
        input.toolId,
        input.environment,
        input.userId,
        input.connector,
      );
      if (!row) return undefined;
      const tokens = JSON.parse(
        await secretBox().open(connectionSlot(input), {
          iv: String(row.iv),
          ciphertext: String(row.ciphertext),
        }),
      ) as ConnectionTokens;
      return {
        ...tokens,
        scopes: JSON.parse(String(row.scopes)) as string[],
        ...(text(row.expires_at) ? { expiresAt: text(row.expires_at) } : {}),
      };
    },

    // ---- seats (D-024: a person with an authenticated call in the workspace, per UTC month)
    /**
     * Counts a person's seat for the current month. Once is enough: calling again changes nothing.
     * A call a tool makes on its own behalf (`tool:<name>`) and a job are not people: no seat.
     */
    async recordSeat(workspace: string, personId: string): Promise<void> {
      if (personId === "" || personId.startsWith("tool:")) return;
      await write(
        `INSERT OR IGNORE INTO "seats" ("workspace", "person_id", "month") VALUES (?, ?, ?)`,
        workspace,
        personId,
        now().slice(0, 7),
      );
    },
    /** The seats of a workspace for a month (`"2026-11"`, UTC; this month by default). */
    async countSeats(workspace: string, month: string = now().slice(0, 7)): Promise<number> {
      const row = await first(
        `SELECT COUNT(*) AS seats FROM "seats" WHERE "workspace" = ? AND "month" = ?`,
        workspace,
        month,
      );
      return Number(row?.seats ?? 0);
    },

    // ---- members (D-027): the people of a workspace and their roles
    async findMember(workspace: string, id: string): Promise<Member | undefined> {
      const row = await first(
        `SELECT * FROM "members" WHERE "workspace" = ? AND "id" = ?`,
        workspace,
        id,
      );
      return row ? toMember(row) : undefined;
    },
    /** Who the identity provider's `subject` is in this workspace, if they are a member. */
    async findMemberBySubject(workspace: string, subject: string): Promise<Member | undefined> {
      const row = await first(
        `SELECT * FROM "members" WHERE "workspace" = ? AND "subject" = ?`,
        workspace,
        subject,
      );
      return row ? toMember(row) : undefined;
    },
    async addMember(input: {
      workspace: string;
      subject: string;
      email: string;
      name: string;
      roles: string[];
    }): Promise<Member> {
      const member: Member = { ...input, id: newId() };
      await write(
        `INSERT INTO "members" ("workspace", "id", "subject", "email", "name", "roles", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?)`,
        member.workspace,
        member.id,
        member.subject,
        member.email,
        member.name,
        JSON.stringify(member.roles),
        now(),
      );
      return member;
    },

    // ---- one-time codes (D-028)
    /**
     * Spends a one-time code: `true` the first time, `false` if it was already spent. Spent codes
     * past their expiry are forgotten.
     */
    async spendCode(id: string, expiresAt: Date): Promise<boolean> {
      try {
        await d1.batch([
          d1.prepare(`DELETE FROM "cli_codes" WHERE "expires_at" < ?`).bind(now()),
          d1
            .prepare(`INSERT INTO "cli_codes" ("id", "expires_at") VALUES (?, ?)`)
            .bind(id, expiresAt.toISOString()),
        ]);
        return true;
      } catch (error) {
        if (/UNIQUE|constraint/i.test(String(error))) return false;
        throw error;
      }
    },

    // ---- token revocation (D-033)
    /** Voids one token, named by its `jti`, until `expiresAt` (its own expiry). */
    async revokeToken(workspace: string, person: string, jti: string, expiresAt: Date) {
      await d1.batch([
        d1.prepare(`DELETE FROM "token_revocations" WHERE "expires_at" < ?`).bind(now()),
        d1
          .prepare(
            `INSERT INTO "token_revocations" ("id", "workspace", "person", "jti", "at", "expires_at") VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            workspace,
            person,
            jti,
            Math.floor(Date.parse(now()) / 1000),
            expiresAt.toISOString(),
          ),
      ]);
    },
    /**
     * Voids every token of a person issued up to now, those of the same second included: when in
     * doubt the token is refused. `lifetime` is the longest a token can live.
     */
    async revokePersonTokens(workspace: string, person: string, lifetimeSeconds: number) {
      await d1.batch([
        d1.prepare(`DELETE FROM "token_revocations" WHERE "expires_at" < ?`).bind(now()),
        d1
          .prepare(
            `INSERT INTO "token_revocations" ("id", "workspace", "person", "jti", "at", "expires_at") VALUES (?, ?, ?, NULL, ?, ?)`,
          )
          .bind(
            newId(),
            workspace,
            person,
            Math.floor(Date.parse(now()) / 1000),
            new Date(Date.parse(now()) + lifetimeSeconds * 1000).toISOString(),
          ),
      ]);
    },
    /** Is this token void? `issuedAt` is the token's `iat`, in seconds; `jti` is absent on old tokens. */
    async isTokenRevoked(
      workspace: string,
      person: string,
      jti: string | undefined,
      issuedAt: number,
    ): Promise<boolean> {
      const row = await first(
        `SELECT 1 AS "hit" FROM "token_revocations" WHERE "workspace" = ? AND "person" = ? AND (("jti" IS NULL AND "at" >= ?) OR "jti" = ?) LIMIT 1`,
        workspace,
        person,
        issuedAt,
        jti ?? "",
      );
      return row !== undefined;
    },

    // ---- per-person secrets (resources.userSecrets: typed by each person, sealed, D-034)
    /** Sets or replaces the secret of one person for one tool. Encrypted before the database. */
    async setUserSecret(input: { toolId: string; person: string; name: string; value: string }) {
      const sealed = await secretBox().seal(
        userSlot(input.toolId, input.person, input.name),
        input.value,
      );
      await write(
        `INSERT INTO "user_secrets" ("tool_id", "person", "name", "iv", "ciphertext", "updated_at") VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("tool_id", "person", "name") DO UPDATE SET "iv" = excluded."iv", "ciphertext" = excluded."ciphertext", "updated_at" = excluded."updated_at"`,
        input.toolId,
        input.person,
        input.name,
        sealed.iv,
        sealed.ciphertext,
        now(),
      );
    },
    /**
     * The decrypted secrets of ONE person for one tool. Only the gateway calls this, to hand a person
     * their own to the tool they call: no route of the platform returns what it gives back.
     */
    async readUserSecrets(toolId: string, person: string): Promise<Record<string, string>> {
      const box = secretBox();
      const out: Record<string, string> = {};
      for (const r of await all(
        `SELECT "name", "iv", "ciphertext" FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ?`,
        toolId,
        person,
      )) {
        const name = String(r.name);
        out[name] = await box.open(userSlot(toolId, person, name), {
          iv: String(r.iv),
          ciphertext: String(r.ciphertext),
        });
      }
      return out;
    },
    /** Who holds which per-person secrets of a tool: names only, for the admin to revoke from. */
    async userSecretHolders(toolId: string): Promise<Array<{ person: string; names: string[] }>> {
      const by = new Map<string, string[]>();
      for (const r of await all(
        `SELECT "person", "name" FROM "user_secrets" WHERE "tool_id" = ? ORDER BY "person", "name"`,
        toolId,
      )) {
        by.set(String(r.person), [...(by.get(String(r.person)) ?? []), String(r.name)]);
      }
      return [...by].map(([person, names]) => ({ person, names }));
    },
    /** The admin's revocation: one secret of one person, or all of that person's, for a tool. */
    async revokeUserSecrets(toolId: string, person: string, name?: string): Promise<number> {
      const found = await all(
        name === undefined
          ? `SELECT 1 FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ?`
          : `SELECT 1 FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ? AND "name" = ?`,
        ...(name === undefined ? [toolId, person] : [toolId, person, name]),
      );
      if (found.length === 0) return 0;
      await write(
        name === undefined
          ? `DELETE FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ?`
          : `DELETE FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ? AND "name" = ?`,
        ...(name === undefined ? [toolId, person] : [toolId, person, name]),
      );
      return found.length;
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
      options: { actor: string; via?: string; kind?: DeploymentKind; url?: string },
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
        auditStatement(
          {
            toolId: version.toolId,
            actor: options.actor,
            ...(options.via ? { via: options.via } : {}),
            kind: DEPLOYMENT_AUDIT[options.kind ?? "deploy"],
            subject: `${String(env.name)}:${version.version}`,
            versionId,
            detail: {
              environment: String(env.name),
              ...(env.branch ? { branch: String(env.branch) } : {}),
            },
          },
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
      via?: string,
    ): Promise<Approval> {
      const row = await first(`SELECT * FROM "approvals" WHERE "id" = ?`, id);
      if (!row) throw new RegistryError("NOT_FOUND", `There is no approval ${id}.`);
      if (row.status !== "pending") {
        throw new RegistryError(
          "ALREADY_DECIDED",
          `The approval ${id} is already ${String(row.status)}.`,
        );
      }
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `UPDATE "approvals" SET "status" = ?, "decided_by" = ?, "decided_at" = ? WHERE "id" = ? AND "status" = 'pending'`,
          )
          .bind(decision, decidedBy, at, id),
        auditStatement(
          {
            toolId: String(row.tool_id),
            actor: decidedBy,
            ...(via ? { via } : {}),
            kind: "approval",
            subject: String(row.resource),
            versionId: String(row.version_id),
            detail: { decision, kind: String(row.kind) },
          },
          at,
        ),
      ]);
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
    /** The versions of a tool that wait for an admin, with what they ask for. */
    async pendingVersions(
      toolId: string,
    ): Promise<{ version: VersionRecord; approvals: Approval[] }[]> {
      const pending = await this.listApprovals(toolId, "pending");
      const byVersion = new Map<string, Approval[]>();
      for (const approval of pending) {
        byVersion.set(approval.versionId, [...(byVersion.get(approval.versionId) ?? []), approval]);
      }
      const out: { version: VersionRecord; approvals: Approval[] }[] = [];
      for (const [versionId, approvals] of byVersion) {
        const version = await this.getVersion(versionId);
        if (version) out.push({ version, approvals });
      }
      return out;
    },

    // ---- audit log
    /** Writes one line of the audit log. */
    async recordAudit(entry: AuditEntry): Promise<void> {
      await d1.batch([auditStatement(entry, now())]);
    },
    /** An action call: who, when, through which interface, with what result. */
    async recordActionCall(call: {
      toolId: string;
      actor: string;
      interface: AuditInterface;
      action: string;
      result: AuditResult;
      via?: string;
    }): Promise<void> {
      await this.recordAudit({
        toolId: call.toolId,
        actor: call.actor,
        interface: call.interface,
        ...(call.via ? { via: call.via } : {}),
        kind: "action",
        subject: call.action,
        result: call.result,
      });
    },
    /** Newest first. */
    async listAudit(
      toolId: string,
      filter: { kind?: AuditKind; limit?: number } = {},
    ): Promise<AuditRecord[]> {
      const rows = filter.kind
        ? await all(
            `SELECT * FROM "audit_log" WHERE "tool_id" = ? AND "kind" = ? ORDER BY "rowid" DESC LIMIT ?`,
            toolId,
            filter.kind,
            filter.limit ?? 100,
          )
        : await all(
            `SELECT * FROM "audit_log" WHERE "tool_id" = ? ORDER BY "rowid" DESC LIMIT ?`,
            toolId,
            filter.limit ?? 100,
          );
      return rows.map(toAudit);
    },
    // ---- roles × actions matrix
    /**
     * The manifest the matrix is read from: the version production serves, else the latest one
     * published. The roles and actions are those of the code; the matrix only moves who may call.
     */
    async currentManifest(toolId: string): Promise<Manifest> {
      const production = (await this.listEnvironments(toolId)).find((e) => e.name === "production");
      const served = production?.versionId
        ? await this.getVersion(production.versionId)
        : undefined;
      const version = served ?? (await this.listVersions(toolId)).at(-1);
      const build = version ? await this.getBuild(version.buildId) : undefined;
      if (!build) throw new RegistryError("NO_MANIFEST", "The tool has no version yet.");
      return build.manifest as Manifest;
    },
    /** What an admin set, per role and action. */
    async roleAccess(toolId: string): Promise<Record<string, Record<string, boolean>>> {
      const out: Record<string, Record<string, boolean>> = {};
      for (const row of await all(
        `SELECT "role", "action", "allowed" FROM "role_access" WHERE "tool_id" = ? ORDER BY "role", "action"`,
        toolId,
      )) {
        (out[String(row.role)] ??= {})[String(row.action)] = Number(row.allowed) === 1;
      }
      return out;
    },
    /** The matrix to show: each cell with what the levels say, what was set, and what applies. */
    async accessMatrix(toolId: string): Promise<AccessMatrix> {
      const manifest = await this.currentManifest(toolId);
      const overrides = await this.roleAccess(toolId);
      const roles = Object.keys(manifest.roles);
      const actions = Object.keys(manifest.actions);
      const cells: AccessMatrix["cells"] = {};
      for (const role of roles) {
        cells[role] = {};
        for (const action of actions) {
          const fallback = manifest.roles[role]!.grants.includes(manifest.actions[action]!.access);
          const override = overrides[role]?.[action];
          cells[role]![action] = {
            default: fallback,
            ...(override === undefined ? {} : { override }),
            allowed: override ?? fallback,
          };
        }
      }
      return { roles, actions, cells };
    },
    /**
     * Sets a cell, effective at once for every interface; `undefined` gives it back to the levels.
     * The role and the action must exist in the tool.
     */
    async setRoleAccess(
      toolId: string,
      role: string,
      action: string,
      allowed: boolean | undefined,
      actor: string,
    ): Promise<void> {
      const manifest = await this.currentManifest(toolId);
      if (!manifest.roles[role])
        throw new RegistryError("NOT_FOUND", `The tool has no role ${role}.`);
      if (!manifest.actions[action]) {
        throw new RegistryError("NOT_FOUND", `The tool has no action ${action}.`);
      }
      if (allowed === undefined) {
        await write(
          `DELETE FROM "role_access" WHERE "tool_id" = ? AND "role" = ? AND "action" = ?`,
          toolId,
          role,
          action,
        );
        return;
      }
      await write(
        `INSERT INTO "role_access" ("tool_id", "role", "action", "allowed", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("tool_id", "role", "action") DO UPDATE SET "allowed" = excluded."allowed", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
        toolId,
        role,
        action,
        allowed ? 1 : 0,
        actor,
        now(),
      );
    },
    /**
     * What the gateway forwards with a person (`access` of the runtime's `User`): the overrides of
     * the roles they hold, and no others.
     */
    async accessFor(
      toolId: string,
      roles: readonly string[],
    ): Promise<Record<string, Record<string, boolean>>> {
      const all = await this.roleAccess(toolId);
      return Object.fromEntries(Object.entries(all).filter(([role]) => roles.includes(role)));
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
