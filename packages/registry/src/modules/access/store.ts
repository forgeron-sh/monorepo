import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { json, text, type Row } from "../../kernel/rows";
import type { AccessMapping, AccessOverrides, Manifest, ProfileGrant } from "@forgeron/manifest";
import {
  ADMIN_ROLE,
  MEMBER_ROLE,
  defaultMapping,
  defaultProfile,
  grantPermissions,
  permissionsOf,
  resolveAccess,
  subjectsOf,
} from "@forgeron/manifest";
import type { AccessMatrix } from "./types";
import type { Catalog } from "../catalog/public";

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = { requireTool: Catalog["requireTool"] } & Pick<
  Catalog["api"],
  "getBuild" | "getVersion" | "listEnvironments" | "listVersions"
>;

/** A workspace role's name, as the members module checks it. */
const ROLE = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;

const toGrant = (row: Row): ProfileGrant => {
  switch (String(row.kind)) {
    case "all":
      return { kind: "all" };
    case "profile":
      return { kind: "profile", profile: text(row.profile) ?? "" };
    case "custom":
      return { kind: "custom", permissions: (json(row.permissions) as string[] | null) ?? [] };
    default:
      return { kind: "none" };
  }
};

/** `admin` first, then `member`, then the others by name: the order of the Access tab. */
const byRole = (a: string, b: string): number => {
  const rank = (r: string) => (r === ADMIN_ROLE ? 0 : r === MEMBER_ROLE ? 1 : 2);
  return rank(a) - rank(b) || a.localeCompare(b);
};

export function createAccess(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, all, auditStatement } = kernel;

  const upsert = (toolId: string, role: string, grant: ProfileGrant, actor: string, at: string) =>
    d1
      .prepare(
        `INSERT INTO "role_profiles" ("tool_id", "role", "kind", "profile", "permissions", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT ("tool_id", "role") DO UPDATE SET "kind" = excluded."kind", "profile" = excluded."profile", "permissions" = excluded."permissions", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
      )
      .bind(
        toolId,
        role,
        grant.kind,
        grant.kind === "profile" ? grant.profile : null,
        grant.kind === "custom" ? JSON.stringify([...new Set(grant.permissions)].sort()) : null,
        actor,
        at,
      );

  /** Does the tool have its mapping written down yet? */
  const hasMapping = async (toolId: string): Promise<boolean> =>
    (await all(`SELECT 1 FROM "role_profiles" WHERE "tool_id" = ? LIMIT 1`, toolId)).length > 0;

  /** The default rows of a tool that has none; a row already there is kept. */
  const seedStatements = (toolId: string, manifest: Manifest, actor: string, at: string) =>
    Object.entries(defaultMapping(manifest.roles ?? {})).map(([role, grant]) =>
      d1
        .prepare(
          `INSERT OR IGNORE INTO "role_profiles" ("tool_id", "role", "kind", "profile", "permissions", "updated_by", "updated_at") VALUES (?, ?, ?, ?, NULL, ?, ?)`,
        )
        .bind(toolId, role, grant.kind, grant.kind === "profile" ? grant.profile : null, actor, at),
    );

  return {
    // ---- the mapping of workspace roles to the tool's profiles (D-127) and the per-action matrix
    /**
     * The manifest the matrix is read from: the version production serves, else the latest one
     * published. The profiles and actions are those of the code; the mapping moves who may call.
     */
    async currentManifest(toolId: string): Promise<Manifest> {
      const production = (await catalog.listEnvironments(toolId)).find(
        (e) => e.name === "production",
      );
      const served = production?.versionId
        ? await catalog.getVersion(production.versionId)
        : undefined;
      const version = served ?? (await catalog.listVersions(toolId)).at(-1);
      const build = version ? await catalog.getBuild(version.buildId) : undefined;
      if (!build) throw new RegistryError("NO_MANIFEST", "The tool has no version yet.");
      return build.manifest as Manifest;
    },
    /**
     * What each workspace role is given in the tool. A tool with no row yet (no deployment since
     * D-127) answers its default mapping, read from `manifest`: the same rows its first deployment
     * writes.
     */
    async roleProfiles(toolId: string, manifest?: Manifest): Promise<AccessMapping> {
      const rows = await all(
        `SELECT "role", "kind", "profile", "permissions" FROM "role_profiles" WHERE "tool_id" = ? ORDER BY "role"`,
        toolId,
      );
      if (rows.length > 0) return Object.fromEntries(rows.map((r) => [String(r.role), toGrant(r)]));
      const read = manifest ?? (await this.currentManifest(toolId).catch(() => undefined));
      return read ? defaultMapping(read.roles ?? {}) : {};
    },
    /**
     * Writes the default mapping of a tool (`admin`: all, `member`: the default profile) unless it
     * has one: called when a version reaches a channel, so a tool arrives with it.
     */
    async seedRoleProfiles(toolId: string, manifest: Manifest, actor: string): Promise<void> {
      if (await hasMapping(toolId)) return;
      // The rows say who wrote them and when; the changes an admin makes later are audited.
      await d1.batch(seedStatements(toolId, manifest, actor, now()));
    },
    /** Maps workspace roles to what they are given in the tool: `updateAccess` with profiles only. */
    async setRoleProfiles(
      toolId: string,
      profiles: ReadonlyArray<{ role: string; grant: ProfileGrant }>,
      actor: string,
      via?: string,
    ): Promise<void> {
      await this.updateAccess(toolId, { profiles }, actor, via);
    },
    /**
     * Changes the mapping (`profiles`) and the per-action exceptions (`changes`) in one D1 batch with
     * their audit lines: all or none. Everything is checked first, so a bad entry changes nothing.
     * A profile must be one of the tool, custom permissions the tool's, an action one of the tool
     * (or `view:<name>`). An entry named twice: the last one wins. A cell set to `undefined` goes
     * back to the mapping. The default rows are written first when the tool has none, so a change
     * never drops them.
     */
    async updateAccess(
      toolId: string,
      input: {
        profiles?: ReadonlyArray<{ role: string; grant: ProfileGrant }>;
        changes?: ReadonlyArray<{ role: string; action: string; allowed: boolean | undefined }>;
      },
      actor: string,
      /** Through which door the change came, when it is not the console (`VIA_FORGERON_MCP`). */
      via?: string,
    ): Promise<void> {
      const manifest = await this.currentManifest(toolId);
      const levels = subjectsOf(manifest);
      const before = await this.roleProfiles(toolId, manifest);
      const overrides = await this.roleAccess(toolId);
      const known = new Set(permissionsOf(manifest));
      const grants = new Map<string, ProfileGrant>();
      for (const { role, grant } of input.profiles ?? []) {
        if (!ROLE.test(role)) {
          throw new RegistryError("INVALID", "A role is a name of letters, digits, - and _.");
        }
        if (grant.kind === "profile" && !manifest.roles?.[grant.profile]) {
          throw new RegistryError("NOT_FOUND", `The tool has no profile ${grant.profile}.`);
        }
        if (grant.kind === "custom") {
          const unknown = grant.permissions.find((p) => !known.has(p));
          if (unknown !== undefined) {
            throw new RegistryError("NOT_FOUND", `The tool has no permission ${unknown}.`);
          }
        }
        grants.set(role, grant);
      }
      const cells = new Map<
        string,
        { role: string; action: string; allowed: boolean | undefined }
      >();
      for (const change of input.changes ?? []) {
        if (!ROLE.test(change.role)) {
          throw new RegistryError("NOT_FOUND", `There is no role ${change.role}.`);
        }
        if (!(change.action in levels)) {
          throw new RegistryError("NOT_FOUND", `The tool has no action ${change.action}.`);
        }
        cells.set(`${change.role}\u0000${change.action}`, change);
      }
      if (grants.size === 0 && cells.size === 0) return;
      const at = now();
      const statements = (await hasMapping(toolId))
        ? []
        : seedStatements(toolId, manifest, actor, at);
      const after = { ...before, ...Object.fromEntries(grants) };
      for (const [role, grant] of grants) {
        statements.push(
          upsert(toolId, role, grant, actor, at),
          auditStatement(
            {
              toolId,
              actor,
              ...(via ? { via } : {}),
              kind: "access",
              subject: `profile:${role}`,
              detail: { role, from: before[role] ?? { kind: "none" }, to: grant },
            },
            at,
          ),
        );
      }
      for (const { role, action, allowed } of cells.values()) {
        const fallback = grantPermissions(after[role], manifest).includes(levels[action]!);
        const from = overrides[role]?.[action] ?? fallback;
        statements.push(
          allowed === undefined
            ? d1
                .prepare(
                  `DELETE FROM "role_access" WHERE "tool_id" = ? AND "role" = ? AND "action" = ?`,
                )
                .bind(toolId, role, action)
            : d1
                .prepare(
                  `INSERT INTO "role_access" ("tool_id", "role", "action", "allowed", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("tool_id", "role", "action") DO UPDATE SET "allowed" = excluded."allowed", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
                )
                .bind(toolId, role, action, allowed ? 1 : 0, actor, at),
          auditStatement(
            {
              toolId,
              actor,
              ...(via ? { via } : {}),
              kind: "access",
              subject: `${role}:${action}`,
              detail: { role, action, from, to: allowed ?? fallback },
            },
            at,
          ),
        );
      }
      await d1.batch(statements);
    },
    /** What an admin set, per role and action: exceptions to the mapping. */
    async roleAccess(toolId: string): Promise<AccessOverrides> {
      const out: AccessOverrides = {};
      for (const row of await all(
        `SELECT "role", "action", "allowed" FROM "role_access" WHERE "tool_id" = ? ORDER BY "role", "action"`,
        toolId,
      )) {
        (out[String(row.role)] ??= {})[String(row.action)] = Number(row.allowed) === 1;
      }
      return out;
    },
    /**
     * The Access tab: the tool's profiles and permissions, the mapping, and for each mapped role
     * (or role with an exception) each subject with what the mapping says, what was set, and what
     * applies.
     */
    async accessMatrix(toolId: string): Promise<AccessMatrix> {
      const manifest = await this.currentManifest(toolId);
      const mapping = await this.roleProfiles(toolId, manifest);
      const overrides = await this.roleAccess(toolId);
      const levels = subjectsOf(manifest);
      const roles = [...new Set([...Object.keys(mapping), ...Object.keys(overrides)])].sort(byRole);
      const cells: AccessMatrix["cells"] = {};
      for (const role of roles) {
        const held = grantPermissions(mapping[role], manifest);
        cells[role] = {};
        for (const [subject, level] of Object.entries(levels)) {
          const fallback = held.includes(level);
          const override = overrides[role]?.[subject];
          cells[role]![subject] = {
            default: fallback,
            ...(override === undefined ? {} : { override }),
            allowed: override ?? fallback,
          };
        }
      }
      const fallback = defaultProfile(manifest.roles ?? {});
      return {
        roles,
        actions: Object.keys(manifest.actions),
        views: Object.keys(manifest.views ?? {}),
        subjects: Object.keys(levels),
        cells,
        levels,
        permissions: permissionsOf(manifest),
        profiles: Object.fromEntries(
          Object.entries(manifest.roles ?? {}).map(([name, p]) => [
            name,
            {
              ...(p.label ? { label: p.label } : {}),
              grants: [...p.grants],
              default: name === fallback,
            },
          ]),
        ),
        mapping: Object.fromEntries(roles.map((role) => [role, mapping[role] ?? { kind: "none" }])),
      };
    },
    /**
     * Sets a cell, effective at once for every interface; `undefined` gives it back to the mapping.
     * The role is a workspace role, the action (or `view:<name>`) one of the tool.
     */
    async setRoleAccess(
      toolId: string,
      role: string,
      action: string,
      allowed: boolean | undefined,
      actor: string,
    ): Promise<void> {
      await this.setRoleAccessMany(toolId, [{ role, action, allowed }], actor);
    },
    /** Sets several cells in one D1 batch with their audit lines: `updateAccess` with cells only. */
    async setRoleAccessMany(
      toolId: string,
      changes: ReadonlyArray<{ role: string; action: string; allowed: boolean | undefined }>,
      actor: string,
      /** Through which door the change came, when it is not the console (`VIA_FORGERON_MCP`). */
      via?: string,
    ): Promise<void> {
      await this.updateAccess(toolId, { changes }, actor, via);
    },
    /**
     * What the gateway forwards with a person (`permissions` and `access` of the runtime's `User`):
     * for each of their roles, the permissions it is mapped to, and every subject of the manifest
     * resolved with the exceptions. A runtime built before D-127 reads only `access`.
     */
    async accessFor(
      toolId: string,
      roles: readonly string[],
      manifest?: Manifest,
    ): Promise<{ permissions: Record<string, string[]>; access: AccessOverrides }> {
      const read = manifest ?? (await this.currentManifest(toolId).catch(() => undefined));
      if (!read) return { permissions: {}, access: {} };
      const mapping = await this.roleProfiles(toolId, read);
      return resolveAccess(roles, mapping, await this.roleAccess(toolId), read);
    },
  };
}
