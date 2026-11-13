import { EVERYONE, ADMIN_TEAM, isBuiltInTeam, isSubject, teamOf } from "@forgeron/permissions";
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { json, text, type Row } from "../../kernel/rows";
import type { AccessGrants, AccessOverrides, Manifest, ProfileGrant } from "@forgeron/manifest";
import {
  defaultGrants,
  defaultProfile,
  grantPermissions,
  permissionsOf,
  resolveAccess,
  subjectsOf as actionsOf,
} from "@forgeron/manifest";
import type { AccessMatrix } from "./types";
import type { Catalog } from "../catalog/public";

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = { requireTool: Catalog["requireTool"] } & Pick<
  Catalog["api"],
  "getBuild" | "getVersion" | "listEnvironments" | "listVersions" | "servedBuild"
>;

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

export function createAccess(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, all, first, auditStatement } = kernel;

  const upsert = (
    toolId: string,
    subject: string,
    grant: ProfileGrant,
    actor: string,
    at: string,
  ) =>
    d1
      .prepare(
        `INSERT INTO "access_grants" ("tool_id", "subject", "kind", "profile", "permissions", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT ("tool_id", "subject") DO UPDATE SET "kind" = excluded."kind", "profile" = excluded."profile", "permissions" = excluded."permissions", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
      )
      .bind(
        toolId,
        subject,
        grant.kind,
        grant.kind === "profile" ? grant.profile : null,
        grant.kind === "custom" ? JSON.stringify([...new Set(grant.permissions)].sort()) : null,
        actor,
        at,
      );

  /** Does the tool have its grants written down yet? */
  const hasGrants = async (toolId: string): Promise<boolean> =>
    (await all(`SELECT 1 FROM "access_grants" WHERE "tool_id" = ? LIMIT 1`, toolId)).length > 0;

  /** The default rows of a tool that has none; a row already there is kept. */
  const seedStatements = (toolId: string, manifest: Manifest, actor: string, at: string) =>
    Object.entries(defaultGrants(manifest.profiles ?? {})).map(([subject, grant]) =>
      d1
        .prepare(
          `INSERT OR IGNORE INTO "access_grants" ("tool_id", "subject", "kind", "profile", "permissions", "updated_by", "updated_at") VALUES (?, ?, ?, ?, NULL, ?, ?)`,
        )
        .bind(
          toolId,
          subject,
          grant.kind,
          grant.kind === "profile" ? grant.profile : null,
          actor,
          at,
        ),
    );

  /** A subject is `everyone` or a team of the tool's workspace (the built-in ones always are). */
  const requireSubject = async (toolId: string, subject: string): Promise<void> => {
    if (!isSubject(subject)) {
      throw new RegistryError("INVALID", `${subject} is not everyone or a team (team:<id>).`);
    }
    const team = teamOf(subject);
    if (team === undefined || isBuiltInTeam(team)) return;
    const row = await first(
      `SELECT 1 AS ok FROM "teams" t JOIN "tools" tl ON tl."workspace" = t."workspace" WHERE tl."id" = ? AND t."id" = ?`,
      toolId,
      team,
    );
    if (!row) throw new RegistryError("NOT_FOUND", `There is no team ${team}.`);
  };

  return {
    // ---- what each subject (everyone, a team) is given in the tool (D-127, D-137) and the per-action matrix
    /**
     * The manifest the matrix is read from: the version production serves, else the latest one
     * published. The profiles and actions are those of the code; the grants move who may call.
     */
    async currentManifest(toolId: string): Promise<Manifest> {
      // Only the manifest is read, and in one query when production serves a version (the usual case).
      const omit = ["worker", "migrations", "views", "changelog"] as const;
      const served = await catalog.servedBuild(toolId, { production: true }, { omit });
      if (served) return served.manifest as Manifest;
      const version = (await catalog.listVersions(toolId)).at(-1);
      const build = version ? await catalog.getBuild(version.buildId, { omit }) : undefined;
      if (!build) throw new RegistryError("NO_MANIFEST", "The tool has no version yet.");
      return build.manifest as Manifest;
    },
    /**
     * What each subject is given in the tool. A tool with no row yet answers its default grants,
     * read from `manifest`: the same rows its first deployment writes.
     */
    async accessGrants(toolId: string, manifest?: Manifest): Promise<AccessGrants> {
      const rows = await all(
        `SELECT "subject", "kind", "profile", "permissions" FROM "access_grants" WHERE "tool_id" = ? ORDER BY "subject"`,
        toolId,
      );
      if (rows.length > 0)
        return Object.fromEntries(rows.map((r) => [String(r.subject), toGrant(r)]));
      const read = manifest ?? (await this.currentManifest(toolId).catch(() => undefined));
      return read ? defaultGrants(read.profiles ?? {}) : {};
    },
    /**
     * Writes the default grants of a tool (`team:admin`: all, `everyone`: the default profile)
     * unless it has some: called when a version reaches a channel, so a tool arrives with them.
     */
    async seedAccessGrants(toolId: string, manifest: Manifest, actor: string): Promise<void> {
      if (await hasGrants(toolId)) return;
      // The rows say who wrote them and when; the changes made later are audited.
      await d1.batch(seedStatements(toolId, manifest, actor, now()));
    },
    /** Gives subjects what they are given in the tool: `updateAccess` with grants only. */
    async setAccessGrants(
      toolId: string,
      grants: ReadonlyArray<{ subject: string; grant: ProfileGrant }>,
      actor: string,
      via?: string,
    ): Promise<void> {
      await this.updateAccess(toolId, { grants }, actor, via);
    },
    /**
     * Changes the grants (`grants`) and the per-action exceptions (`changes`) in one D1 batch with
     * their audit lines: all or none. Everything is checked first, so a bad entry changes nothing.
     * A profile must be one of the tool, custom permissions the tool's, an action one of the tool
     * (or `view:<name>`), a subject `everyone` or a team. An entry named twice: the last one wins.
     * A cell set to `undefined` goes back to the grant. The default rows are written first when the
     * tool has none, so a change never drops them.
     */
    async updateAccess(
      toolId: string,
      input: {
        grants?: ReadonlyArray<{ subject: string; grant: ProfileGrant }>;
        changes?: ReadonlyArray<{ subject: string; action: string; allowed: boolean | undefined }>;
      },
      actor: string,
      /** Through which door the change came, when it is not the console (`VIA_FORGERON_MCP`). */
      via?: string,
    ): Promise<void> {
      const manifest = await this.currentManifest(toolId);
      const levels = actionsOf(manifest);
      const before = await this.accessGrants(toolId, manifest);
      const overrides = await this.accessExceptions(toolId);
      const known = new Set(permissionsOf(manifest));
      const grants = new Map<string, ProfileGrant>();
      for (const { subject, grant } of input.grants ?? []) {
        await requireSubject(toolId, subject);
        if (grant.kind === "profile" && !manifest.profiles?.[grant.profile]) {
          throw new RegistryError("NOT_FOUND", `The tool has no profile ${grant.profile}.`);
        }
        if (grant.kind === "custom") {
          const unknown = grant.permissions.find((p) => !known.has(p));
          if (unknown !== undefined) {
            throw new RegistryError("NOT_FOUND", `The tool has no permission ${unknown}.`);
          }
        }
        grants.set(subject, grant);
      }
      const cells = new Map<
        string,
        { subject: string; action: string; allowed: boolean | undefined }
      >();
      for (const change of input.changes ?? []) {
        await requireSubject(toolId, change.subject);
        if (!(change.action in levels)) {
          throw new RegistryError("NOT_FOUND", `The tool has no action ${change.action}.`);
        }
        cells.set(`${change.subject}\u0000${change.action}`, change);
      }
      if (grants.size === 0 && cells.size === 0) return;
      const at = now();
      const statements = (await hasGrants(toolId))
        ? []
        : seedStatements(toolId, manifest, actor, at);
      const after = { ...before, ...Object.fromEntries(grants) };
      for (const [subject, grant] of grants) {
        statements.push(
          upsert(toolId, subject, grant, actor, at),
          auditStatement(
            {
              toolId,
              actor,
              ...(via ? { via } : {}),
              kind: "access",
              subject: `grant:${subject}`,
              detail: { subject, from: before[subject] ?? { kind: "none" }, to: grant },
            },
            at,
          ),
        );
      }
      for (const { subject, action, allowed } of cells.values()) {
        const fallback = grantPermissions(after[subject], manifest).includes(levels[action]!);
        const from = overrides[subject]?.[action] ?? fallback;
        statements.push(
          allowed === undefined
            ? d1
                .prepare(
                  `DELETE FROM "access_exceptions" WHERE "tool_id" = ? AND "subject" = ? AND "action" = ?`,
                )
                .bind(toolId, subject, action)
            : d1
                .prepare(
                  `INSERT INTO "access_exceptions" ("tool_id", "subject", "action", "allowed", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("tool_id", "subject", "action") DO UPDATE SET "allowed" = excluded."allowed", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
                )
                .bind(toolId, subject, action, allowed ? 1 : 0, actor, at),
          auditStatement(
            {
              toolId,
              actor,
              ...(via ? { via } : {}),
              kind: "access",
              subject: `${subject}:${action}`,
              detail: { subject, action, from, to: allowed ?? fallback },
            },
            at,
          ),
        );
      }
      await d1.batch(statements);
    },
    /** What someone set, per subject and action: exceptions to the grants. */
    async accessExceptions(toolId: string): Promise<AccessOverrides> {
      const out: AccessOverrides = {};
      for (const row of await all(
        `SELECT "subject", "action", "allowed" FROM "access_exceptions" WHERE "tool_id" = ? ORDER BY "subject", "action"`,
        toolId,
      )) {
        (out[String(row.subject)] ??= {})[String(row.action)] = Number(row.allowed) === 1;
      }
      return out;
    },
    /**
     * The Access tab: the tool's profiles and permissions, and for `everyone` and each team (and any
     * other subject that has a grant or an exception) what its grant says, what was set, and what
     * applies, for each action and view.
     */
    async accessMatrix(toolId: string): Promise<AccessMatrix> {
      const manifest = await this.currentManifest(toolId);
      const grants = await this.accessGrants(toolId, manifest);
      const overrides = await this.accessExceptions(toolId);
      const levels = actionsOf(manifest);
      const teams = await all(
        `SELECT t."id", t."name" FROM "teams" t JOIN "tools" tl ON tl."workspace" = t."workspace" WHERE tl."id" = ?`,
        toolId,
      );
      const names = new Map(teams.map((r) => [`team:${String(r.id)}`, String(r.name)]));
      // The built-in teams are always rows, even in a workspace that has not read them yet.
      for (const id of [ADMIN_TEAM, "developer"]) {
        if (!names.has(`team:${id}`))
          names.set(`team:${id}`, id === ADMIN_TEAM ? "Admins" : "Developers");
      }
      const others = [...Object.keys(grants), ...Object.keys(overrides)].filter(
        (s) => s !== EVERYONE && !names.has(s),
      );
      const subjectLabels: Record<string, string> = { [EVERYONE]: "Everyone" };
      for (const [subject, name] of names) subjectLabels[subject] = name;
      for (const subject of others) subjectLabels[subject] = subject;
      const subjects = [
        EVERYONE,
        ...[...new Set([...names.keys(), ...others])].sort(
          (a, b) => subjectLabels[a]!.localeCompare(subjectLabels[b]!) || a.localeCompare(b),
        ),
      ];
      const cells: AccessMatrix["cells"] = {};
      for (const subject of subjects) {
        const held = grantPermissions(grants[subject], manifest);
        cells[subject] = {};
        for (const [column, level] of Object.entries(levels)) {
          const fallback = held.includes(level);
          const override = overrides[subject]?.[column];
          cells[subject]![column] = {
            default: fallback,
            ...(override === undefined ? {} : { override }),
            allowed: override ?? fallback,
          };
        }
      }
      const fallback = defaultProfile(manifest.profiles ?? {});
      return {
        subjects,
        subjectLabels,
        actions: Object.keys(manifest.actions),
        views: Object.keys(manifest.views ?? {}),
        columns: Object.keys(levels),
        cells,
        levels,
        permissions: permissionsOf(manifest),
        profiles: Object.fromEntries(
          Object.entries(manifest.profiles ?? {}).map(([name, p]) => [
            name,
            {
              ...(p.label ? { label: p.label } : {}),
              grants: [...p.grants],
              default: name === fallback,
            },
          ]),
        ),
        grants: Object.fromEntries(subjects.map((s) => [s, grants[s] ?? { kind: "none" }])),
      };
    },
    /**
     * Sets a cell, effective at once for every interface; `undefined` gives it back to the grant.
     * The subject is `everyone` or a team, the action (or `view:<name>`) one of the tool.
     */
    async setAccessException(
      toolId: string,
      subject: string,
      action: string,
      allowed: boolean | undefined,
      actor: string,
    ): Promise<void> {
      await this.setAccessExceptions(toolId, [{ subject, action, allowed }], actor);
    },
    /** Sets several cells in one D1 batch with their audit lines: `updateAccess` with cells only. */
    async setAccessExceptions(
      toolId: string,
      changes: ReadonlyArray<{ subject: string; action: string; allowed: boolean | undefined }>,
      actor: string,
      /** Through which door the change came, when it is not the console (`VIA_FORGERON_MCP`). */
      via?: string,
    ): Promise<void> {
      await this.updateAccess(toolId, { changes }, actor, via);
    },
    /**
     * What the gateway forwards with a person (`permissions` and `access` of the runtime's `User`):
     * for each of their subjects (`subjectsOf(teams)` of `@forgeron/permissions`), the permissions it
     * is given, and every action of the manifest resolved with the exceptions.
     */
    async accessFor(
      toolId: string,
      subjects: readonly string[],
      manifest?: Manifest,
    ): Promise<{ permissions: Record<string, string[]>; access: AccessOverrides }> {
      const read = manifest ?? (await this.currentManifest(toolId).catch(() => undefined));
      if (!read) return { permissions: {}, access: {} };
      const [grants, exceptions] = await Promise.all([
        this.accessGrants(toolId, read),
        this.accessExceptions(toolId),
      ]);
      return resolveAccess(subjects, grants, exceptions, read);
    },
  };
}
