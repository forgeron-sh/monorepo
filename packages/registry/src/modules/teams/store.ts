import {
  ADMIN_TEAM,
  ALL,
  BUILT_IN_TEAMS,
  PLATFORM,
  PLATFORM_PERMISSIONS,
  isBuiltInTeam,
  isTeamId,
  missingToGrant,
  platformPermissions,
  storedPlatformGrants,
  type PlatformPermission,
} from "@forgeron/permissions";
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { toTeam, type Team } from "./types";

const MAX_MEMBERS = 500;

/** What the other modules ask of the teams: the built-in teams exist, and the rule against escalation. */
export type TeamsPort = Pick<
  ReturnType<typeof createTeams>,
  "ensureBuiltInTeams" | "requireMayGrant" | "findTeam"
>;

export function createTeams(kernel: Kernel) {
  const { d1, now, all, first, auditStatement } = kernel;

  const membersOf = async (workspace: string, teamId?: string) => {
    const rows = await all(
      `SELECT "team_id", "member_id" FROM "team_members" WHERE "workspace" = ?${teamId ? ` AND "team_id" = ?` : ""} ORDER BY "member_id"`,
      ...(teamId ? [workspace, teamId] : [workspace]),
    );
    const byTeam = new Map<string, string[]>();
    for (const r of rows) {
      const list = byTeam.get(String(r.team_id)) ?? [];
      list.push(String(r.member_id));
      byTeam.set(String(r.team_id), list);
    }
    return byTeam;
  };

  /** What each team of the workspace was given, as stored. `admin` always holds every permission. */
  const grantsOf = async (workspace: string): Promise<Map<string, string[]>> => {
    const rows = await all(
      `SELECT "team_id", "permission" FROM "team_permissions" WHERE "workspace" = ? ORDER BY "team_id", "permission"`,
      workspace,
    );
    const byTeam = new Map<string, string[]>();
    for (const r of rows) {
      const list = byTeam.get(String(r.team_id)) ?? [];
      list.push(String(r.permission));
      byTeam.set(String(r.team_id), list);
    }
    byTeam.set(ADMIN_TEAM, [ALL]);
    return byTeam;
  };

  const build = (
    row: Parameters<typeof toTeam>[0],
    members: string[],
    grants: Map<string, string[]>,
  ): Team => {
    const id = String(row.id);
    // In the catalog's order, whatever the order of the rows.
    const permissions = storedPlatformGrants(grants.get(id) ?? []);
    return toTeam(
      row,
      members,
      permissions,
      BUILT_IN_TEAMS.some((t) => t.id === id && t.locked),
      platformPermissions([id], { [id]: permissions }),
    );
  };

  /** Stored form of platform permissions: refuses a name that is not in the catalog. */
  const checkPermissions = (permissions: readonly string[]): string[] => {
    const unknown = permissions.find(
      (p) => p !== ALL && !PLATFORM_PERMISSIONS.includes(p as never),
    );
    if (unknown !== undefined) {
      throw new RegistryError("INVALID", `${unknown} is not a permission of the platform.`);
    }
    return storedPlatformGrants(permissions);
  };

  const api = {
    // ---- teams (D-132, D-137): named groups of the workspace's members, and what they may do
    /** Creates the built-in teams the workspace lacks (`admin`, `developer`); idempotent. */
    async ensureBuiltInTeams(workspace: string): Promise<void> {
      const have = new Set(
        (
          await all(`SELECT "id" FROM "teams" WHERE "workspace" = ? AND "built_in" = 1`, workspace)
        ).map((r) => String(r.id)),
      );
      const missing = BUILT_IN_TEAMS.filter((t) => !have.has(t.id));
      if (missing.length === 0) return;
      const at = now();
      await d1.batch(
        missing.flatMap((t) => [
          d1
            .prepare(
              `INSERT OR IGNORE INTO "teams" ("workspace", "id", "name", "description", "created_at", "built_in") VALUES (?, ?, ?, ?, ?, 1)`,
            )
            .bind(workspace, t.id, t.name, t.description, at),
          d1
            .prepare(`UPDATE "teams" SET "built_in" = 1 WHERE "workspace" = ? AND "id" = ?`)
            .bind(workspace, t.id),
          ...t.permissions.map((p) =>
            d1
              .prepare(
                `INSERT OR IGNORE INTO "team_permissions" ("workspace", "team_id", "permission") VALUES (?, ?, ?)`,
              )
              .bind(workspace, t.id, p),
          ),
        ]),
      );
    },
    /**
     * The rule against escalation (D-137): the actor may give, or take away, only permissions they
     * hold. `actorPermissions` are the platform permissions of the person who acts. Refused with
     * `FORBIDDEN`, naming what they lack.
     */
    requireMayGrant(actorPermissions: readonly string[], permissions: readonly string[]): void {
      const missing = missingToGrant(PLATFORM, actorPermissions, permissions);
      if (missing.length > 0) {
        throw new RegistryError(
          "FORBIDDEN",
          `You can only give what you hold: you lack ${missing.join(", ")}.`,
        );
      }
    },
    /** Built-in teams first, then by name. */
    async listTeams(workspace: string): Promise<Team[]> {
      await this.ensureBuiltInTeams(workspace);
      const rows = await all(
        `SELECT * FROM "teams" WHERE "workspace" = ? ORDER BY "built_in" DESC, "name"`,
        workspace,
      );
      const members = await membersOf(workspace);
      const grants = await grantsOf(workspace);
      return rows.map((r) => build(r, members.get(String(r.id)) ?? [], grants));
    },
    async findTeam(workspace: string, id: string): Promise<Team | undefined> {
      await this.ensureBuiltInTeams(workspace);
      const row = await first(
        `SELECT * FROM "teams" WHERE "workspace" = ? AND "id" = ?`,
        workspace,
        id,
      );
      if (!row) return undefined;
      return build(row, (await membersOf(workspace, id)).get(id) ?? [], await grantsOf(workspace));
    },
    /** The ids of the teams a member belongs to. */
    async teamsOfMember(workspace: string, memberId: string): Promise<string[]> {
      const rows = await all(
        `SELECT "team_id" FROM "team_members" WHERE "workspace" = ? AND "member_id" = ? ORDER BY "team_id"`,
        workspace,
        memberId,
      );
      return rows.map((r) => String(r.team_id));
    },
    /** What the person may do on the platform: the union of what their teams were given. */
    async platformPermissionsOf(
      workspace: string,
      memberId: string,
    ): Promise<PlatformPermission[]> {
      const teams = await this.teamsOfMember(workspace, memberId);
      if (teams.length === 0) return [];
      return platformPermissions(teams, Object.fromEntries(await grantsOf(workspace)));
    },
    /**
     * Creates a team. Giving it permissions, or members who then hold them, is limited to what the
     * actor holds (`actorPermissions`).
     */
    async createTeam(
      workspace: string,
      input: {
        id: string;
        name: string;
        description?: string;
        members?: readonly string[];
        permissions?: readonly string[];
      },
      actor: string,
      actorPermissions: readonly string[],
      via?: string,
    ): Promise<Team> {
      if (!isTeamId(input.id)) {
        throw new RegistryError(
          "INVALID",
          "A team's address is 2 to 34 lower case letters, digits and -, starting with a letter.",
        );
      }
      const name = input.name.trim();
      if (!name || name.length > 80)
        throw new RegistryError("INVALID", "A team needs a name of up to 80 characters.");
      if (await this.findTeam(workspace, input.id)) {
        throw new RegistryError("ALREADY_EXISTS", `There is already a team ${input.id}.`);
      }
      const members = await this.checkMembers(workspace, input.members ?? []);
      const permissions = checkPermissions(input.permissions ?? []);
      this.requireMayGrant(actorPermissions, permissions);
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "teams" ("workspace", "id", "name", "description", "created_at", "built_in") VALUES (?, ?, ?, ?, ?, 0)`,
          )
          .bind(workspace, input.id, name, input.description?.trim() ?? "", at),
        ...members.map((m) =>
          d1
            .prepare(
              `INSERT INTO "team_members" ("workspace", "team_id", "member_id") VALUES (?, ?, ?)`,
            )
            .bind(workspace, input.id, m),
        ),
        ...permissions.map((p) =>
          d1
            .prepare(
              `INSERT INTO "team_permissions" ("workspace", "team_id", "permission") VALUES (?, ?, ?)`,
            )
            .bind(workspace, input.id, p),
        ),
        auditStatement(
          {
            actor,
            interface: "api",
            ...(via ? { via } : {}),
            kind: "access",
            subject: "team:create",
            detail: { workspace, team: input.id, name, members, permissions },
          },
          at,
        ),
      ]);
      return (await this.findTeam(workspace, input.id))!;
    },
    /**
     * Renames a team, changes its description, replaces its members and/or its permissions. A change
     * of members or permissions is limited to what the actor holds, as the team's permissions
     * before and after (`actorPermissions`); `admin` keeps every permission and at least one member.
     */
    async updateTeam(
      workspace: string,
      id: string,
      change: {
        name?: string;
        description?: string;
        members?: readonly string[];
        permissions?: readonly string[];
      },
      actor: string,
      actorPermissions: readonly string[],
      via?: string,
    ): Promise<Team> {
      const team = await this.findTeam(workspace, id);
      if (!team) throw new RegistryError("NOT_FOUND", `There is no team ${id}.`);
      const name = change.name === undefined ? team.name : change.name.trim();
      if (!name || name.length > 80)
        throw new RegistryError("INVALID", "A team needs a name of up to 80 characters.");
      const description =
        change.description === undefined ? team.description : change.description.trim();
      const members =
        change.members === undefined
          ? team.members
          : await this.checkMembers(workspace, change.members);
      const permissions =
        change.permissions === undefined ? team.permissions : checkPermissions(change.permissions);
      const permissionsChanged = permissions.join() !== team.permissions.join();
      const membersChanged =
        members.length !== team.members.length || members.some((m) => !team.members.includes(m));
      if (permissionsChanged && team.locked) {
        throw new RegistryError("PROTECTED", `The permissions of ${team.name} cannot be changed.`);
      }
      if (id === ADMIN_TEAM && members.length === 0) {
        throw new RegistryError("LAST_ADMIN", "A workspace needs at least one administrator.");
      }
      if (permissionsChanged || membersChanged) {
        this.requireMayGrant(actorPermissions, [...team.permissions, ...permissions]);
      }
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `UPDATE "teams" SET "name" = ?, "description" = ? WHERE "workspace" = ? AND "id" = ?`,
          )
          .bind(name, description, workspace, id),
        d1
          .prepare(`DELETE FROM "team_members" WHERE "workspace" = ? AND "team_id" = ?`)
          .bind(workspace, id),
        ...members.map((m) =>
          d1
            .prepare(
              `INSERT INTO "team_members" ("workspace", "team_id", "member_id") VALUES (?, ?, ?)`,
            )
            .bind(workspace, id, m),
        ),
        ...(permissionsChanged
          ? [
              d1
                .prepare(`DELETE FROM "team_permissions" WHERE "workspace" = ? AND "team_id" = ?`)
                .bind(workspace, id),
              ...permissions.map((p) =>
                d1
                  .prepare(
                    `INSERT INTO "team_permissions" ("workspace", "team_id", "permission") VALUES (?, ?, ?)`,
                  )
                  .bind(workspace, id, p),
              ),
              auditStatement(
                {
                  actor,
                  interface: "api",
                  ...(via ? { via } : {}),
                  kind: "access",
                  subject: "team:permissions",
                  detail: { workspace, team: id, from: team.permissions, to: permissions },
                },
                at,
              ),
            ]
          : []),
        auditStatement(
          {
            actor,
            interface: "api",
            ...(via ? { via } : {}),
            kind: "access",
            subject: "team:update",
            detail: { workspace, team: id, from: team.members, to: members, name },
          },
          at,
        ),
      ]);
      return (await this.findTeam(workspace, id))!;
    },
    /** Sets what a team may do on the platform; `updateTeam` with permissions only. */
    async setTeamPermissions(
      workspace: string,
      id: string,
      permissions: readonly string[],
      actor: string,
      actorPermissions: readonly string[],
      via?: string,
    ): Promise<Team> {
      return this.updateTeam(workspace, id, { permissions }, actor, actorPermissions, via);
    },
    /** Deletes a team, with what it was given in tools. A built-in team cannot be deleted. */
    async deleteTeam(workspace: string, id: string, actor: string, via?: string): Promise<void> {
      const team = await this.findTeam(workspace, id);
      if (!team) throw new RegistryError("NOT_FOUND", `There is no team ${id}.`);
      if (isBuiltInTeam(id) && team.builtIn) {
        throw new RegistryError("PROTECTED", `${team.name} is built into every workspace.`);
      }
      await d1.batch([
        d1
          .prepare(`DELETE FROM "team_members" WHERE "workspace" = ? AND "team_id" = ?`)
          .bind(workspace, id),
        d1
          .prepare(`DELETE FROM "team_permissions" WHERE "workspace" = ? AND "team_id" = ?`)
          .bind(workspace, id),
        d1.prepare(`DELETE FROM "teams" WHERE "workspace" = ? AND "id" = ?`).bind(workspace, id),
        // What the team was given in tools goes with it: its grants and its exceptions.
        d1
          .prepare(
            `DELETE FROM "access_grants" WHERE "subject" = ? AND "tool_id" IN (SELECT "id" FROM "tools" WHERE "workspace" = ?)`,
          )
          .bind(`team:${id}`, workspace),
        d1
          .prepare(
            `DELETE FROM "access_exceptions" WHERE "subject" = ? AND "tool_id" IN (SELECT "id" FROM "tools" WHERE "workspace" = ?)`,
          )
          .bind(`team:${id}`, workspace),
        auditStatement(
          {
            actor,
            interface: "api",
            ...(via ? { via } : {}),
            kind: "access",
            subject: "team:delete",
            detail: { workspace, team: id, name: team.name, members: team.members },
          },
          now(),
        ),
      ]);
    },
    /** Only members of the workspace belong to a team: a stranger's id is refused. */
    async checkMembers(workspace: string, ids: readonly string[]): Promise<string[]> {
      const unique = [...new Set(ids)];
      if (unique.length > MAX_MEMBERS)
        throw new RegistryError("INVALID", `A team has at most ${MAX_MEMBERS} members.`);
      for (const id of unique) {
        const row = await first(
          `SELECT 1 AS ok FROM "members" WHERE "workspace" = ? AND "id" = ?`,
          workspace,
          id,
        );
        if (!row) throw new RegistryError("INVALID", `${id} is not a member of ${workspace}.`);
      }
      return unique;
    },
  };
  return api;
}
