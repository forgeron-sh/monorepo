import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { toTeam, type Team } from "./types";

const SLUG = /^[a-z][a-z0-9-]{1,33}$/;
const MAX_MEMBERS = 500;

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

  return {
    // ---- teams (D-132): named groups of the workspace's members
    async listTeams(workspace: string): Promise<Team[]> {
      const rows = await all(
        `SELECT * FROM "teams" WHERE "workspace" = ? ORDER BY "name"`,
        workspace,
      );
      const members = await membersOf(workspace);
      return rows.map((r) => toTeam(r, members.get(String(r.id)) ?? []));
    },
    async findTeam(workspace: string, id: string): Promise<Team | undefined> {
      const row = await first(
        `SELECT * FROM "teams" WHERE "workspace" = ? AND "id" = ?`,
        workspace,
        id,
      );
      if (!row) return undefined;
      return toTeam(row, (await membersOf(workspace, id)).get(id) ?? []);
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
    async createTeam(
      workspace: string,
      input: { id: string; name: string; description?: string; members?: readonly string[] },
      actor: string,
    ): Promise<Team> {
      if (!SLUG.test(input.id)) {
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
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "teams" ("workspace", "id", "name", "description", "created_at") VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(workspace, input.id, name, input.description?.trim() ?? "", at),
        ...members.map((m) =>
          d1
            .prepare(
              `INSERT INTO "team_members" ("workspace", "team_id", "member_id") VALUES (?, ?, ?)`,
            )
            .bind(workspace, input.id, m),
        ),
        auditStatement(
          {
            actor,
            interface: "api",
            kind: "access",
            subject: "team:create",
            detail: { workspace, team: input.id, name, members },
          },
          at,
        ),
      ]);
      return (await this.findTeam(workspace, input.id))!;
    },
    /** Renames a team, changes its description and/or replaces its members. */
    async updateTeam(
      workspace: string,
      id: string,
      change: { name?: string; description?: string; members?: readonly string[] },
      actor: string,
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
        auditStatement(
          {
            actor,
            interface: "api",
            kind: "access",
            subject: "team:update",
            detail: { workspace, team: id, from: team.members, to: members, name },
          },
          at,
        ),
      ]);
      return (await this.findTeam(workspace, id))!;
    },
    async deleteTeam(workspace: string, id: string, actor: string): Promise<void> {
      const team = await this.findTeam(workspace, id);
      if (!team) throw new RegistryError("NOT_FOUND", `There is no team ${id}.`);
      await d1.batch([
        d1
          .prepare(`DELETE FROM "team_members" WHERE "workspace" = ? AND "team_id" = ?`)
          .bind(workspace, id),
        d1.prepare(`DELETE FROM "teams" WHERE "workspace" = ? AND "id" = ?`).bind(workspace, id),
        // What the team was given in tools goes with it: its row of the mapping and its exceptions.
        d1
          .prepare(
            `DELETE FROM "role_profiles" WHERE "role" = ? AND "tool_id" IN (SELECT "id" FROM "tools" WHERE "workspace" = ?)`,
          )
          .bind(`team-${id}`, workspace),
        d1
          .prepare(
            `DELETE FROM "role_access" WHERE "role" = ? AND "tool_id" IN (SELECT "id" FROM "tools" WHERE "workspace" = ?)`,
          )
          .bind(`team-${id}`, workspace),
        auditStatement(
          {
            actor,
            interface: "api",
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
}
