import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import type { Manifest } from "@forgeron/manifest";
import { viewSubject } from "@forgeron/manifest";
import type { AccessMatrix } from "./types";
import type { Catalog } from "../catalog/public";

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = { requireTool: Catalog["requireTool"] } & Pick<
  Catalog["api"],
  "getBuild" | "getVersion" | "listEnvironments" | "listVersions"
>;

export function createAccess(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, all, auditStatement } = kernel;
  /** The columns of the matrix and the level each one is checked against: actions, then views. */
  const matrixSubjects = (manifest: Manifest): Record<string, string> => ({
    ...Object.fromEntries(Object.entries(manifest.actions).map(([name, a]) => [name, a.access])),
    ...Object.fromEntries(
      Object.entries(manifest.views ?? {}).map(([name, v]) => [viewSubject(name), v.access]),
    ),
  });

  return {
    // ---- roles × actions matrix
    /**
     * The manifest the matrix is read from: the version production serves, else the latest one
     * published. The roles and actions are those of the code; the matrix only moves who may call.
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
      const levels = matrixSubjects(manifest);
      const roles = Object.keys(manifest.roles);
      const cells: AccessMatrix["cells"] = {};
      for (const role of roles) {
        cells[role] = {};
        for (const [subject, level] of Object.entries(levels)) {
          const fallback = manifest.roles[role]!.grants.includes(level);
          const override = overrides[role]?.[subject];
          cells[role]![subject] = {
            default: fallback,
            ...(override === undefined ? {} : { override }),
            allowed: override ?? fallback,
          };
        }
      }
      return {
        roles,
        actions: Object.keys(manifest.actions),
        views: Object.keys(manifest.views ?? {}),
        subjects: Object.keys(levels),
        cells,
      };
    },
    /**
     * Sets a cell, effective at once for every interface; `undefined` gives it back to the levels.
     * The role and the action (or `view:<name>`) must exist in the tool.
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
    /**
     * Sets several cells in one D1 batch with their audit lines: all or none. Every cell is
     * checked first, so a bad one changes nothing. Cells named twice: the last one wins.
     */
    async setRoleAccessMany(
      toolId: string,
      changes: ReadonlyArray<{ role: string; action: string; allowed: boolean | undefined }>,
      actor: string,
      /** Through which door the change came, when it is not the console (`VIA_FORGERON_MCP`). */
      via?: string,
    ): Promise<void> {
      const manifest = await this.currentManifest(toolId);
      const before = (await this.accessMatrix(toolId)).cells;
      const last = new Map<string, (typeof changes)[number]>();
      for (const change of changes) {
        if (!manifest.roles[change.role]) {
          throw new RegistryError("NOT_FOUND", `The tool has no role ${change.role}.`);
        }
        if (!(change.action in matrixSubjects(manifest))) {
          throw new RegistryError("NOT_FOUND", `The tool has no action ${change.action}.`);
        }
        last.set(`${change.role}\u0000${change.action}`, change);
      }
      const at = now();
      const statements = [];
      for (const { role, action, allowed } of last.values()) {
        const cell = before[role]![action]!;
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
              detail: { role, action, from: cell.allowed, to: allowed ?? cell.default },
            },
            at,
          ),
        );
      }
      if (statements.length > 0) await d1.batch(statements);
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
  };
}
