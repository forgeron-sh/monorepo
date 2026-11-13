import { ADMIN_TEAM, isTeamId } from "@forgeron/permissions";
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { json, text } from "../../kernel/rows";
import type { TeamsPort } from "../teams/public";
import { toInvitation, toMember } from "./types";
import type { Member, Invitation, MembershipSettings, JoinVia } from "./types";

/** A picture is a small image kept as a data URL: png, jpeg or webp, 64 KB at most once decoded. */
const IMAGE = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_IMAGE_BASE64 = 88_000;

const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function createMembers(kernel: Kernel, teams: TeamsPort) {
  const { d1, now, newId, all, first, write, auditStatement } = kernel;

  /** The teams of one member, by id. */
  const teamsOf = async (workspace: string, id: string): Promise<string[]> =>
    (
      await all(
        `SELECT "team_id" FROM "team_members" WHERE "workspace" = ? AND "member_id" = ? ORDER BY "team_id"`,
        workspace,
        id,
      )
    ).map((r) => String(r.team_id));
  /** The teams of each member of the workspace (one read for the whole workspace). */
  const teamsByMember = async (workspace: string): Promise<Map<string, string[]>> => {
    const byMember = new Map<string, string[]>();
    for (const r of await all(
      `SELECT "team_id", "member_id" FROM "team_members" WHERE "workspace" = ? ORDER BY "team_id"`,
      workspace,
    )) {
      const list = byMember.get(String(r.member_id)) ?? [];
      list.push(String(r.team_id));
      byMember.set(String(r.member_id), list);
    }
    return byMember;
  };
  /** The teams of the workspace among these ids: an id that is no team (deleted since) is left out. */
  const knownTeams = async (workspace: string, ids: readonly string[]): Promise<string[]> => {
    const unique = [...new Set(ids)].filter(isTeamId);
    if (unique.length === 0) return [];
    await teams.ensureBuiltInTeams(workspace);
    const rows = await all(`SELECT "id" FROM "teams" WHERE "workspace" = ?`, workspace);
    const exist = new Set(rows.map((r) => String(r.id)));
    return unique.filter((id) => exist.has(id));
  };
  /** Refuses a team that is not one of the workspace, and one the actor may not put people in. */
  const requireTeams = async (
    workspace: string,
    ids: readonly string[],
    actorPermissions: readonly string[],
  ): Promise<string[]> => {
    const unique = [...new Set(ids)];
    const known = await knownTeams(workspace, unique);
    const unknown = unique.find((id) => !known.includes(id));
    if (unknown !== undefined) {
      throw new RegistryError("INVALID", `${unknown} is not a team of ${workspace}.`);
    }
    for (const id of unique) {
      teams.requireMayGrant(actorPermissions, (await teams.findTeam(workspace, id))!.permissions);
    }
    return unique;
  };
  /** The members of the admin team other than this one. */
  const otherAdmins = async (workspace: string, except: string): Promise<number> =>
    (
      await all(
        `SELECT "member_id" FROM "team_members" WHERE "workspace" = ? AND "team_id" = ? AND "member_id" <> ?`,
        workspace,
        ADMIN_TEAM,
        except,
      )
    ).length;

  return {
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

    // ---- members (D-027): the people of a workspace and their teams (D-137)
    async findMember(workspace: string, id: string): Promise<Member | undefined> {
      // The member and their teams are read together: both are asked for by the same id.
      const [row, teams] = await Promise.all([
        first(`SELECT * FROM "members" WHERE "workspace" = ? AND "id" = ?`, workspace, id),
        teamsOf(workspace, id),
      ]);
      return row ? toMember(row, teams) : undefined;
    },
    /** Who the identity provider's `subject` is in this workspace, if they are a member. */
    async findMemberBySubject(workspace: string, subject: string): Promise<Member | undefined> {
      const row = await first(
        `SELECT * FROM "members" WHERE "workspace" = ? AND "subject" = ?`,
        workspace,
        subject,
      );
      return row ? toMember(row, await teamsOf(workspace, String(row.id))) : undefined;
    },
    /** Adds a person, in these teams; a team of the list that does not exist is left out. */
    async addMember(input: {
      workspace: string;
      subject: string;
      email: string;
      name: string;
      teams: readonly string[];
    }): Promise<Member> {
      const memberTeams = await knownTeams(input.workspace, input.teams);
      const member: Member = {
        workspace: input.workspace,
        subject: input.subject,
        email: input.email,
        name: input.name,
        teams: memberTeams,
        id: newId(),
      };
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "members" ("workspace", "id", "subject", "email", "name", "created_at") VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(member.workspace, member.id, member.subject, member.email, member.name, now()),
        ...memberTeams.map((team) =>
          d1
            .prepare(
              `INSERT INTO "team_members" ("workspace", "team_id", "member_id") VALUES (?, ?, ?)`,
            )
            .bind(member.workspace, team, member.id),
        ),
      ]);
      return member;
    },

    async listMembers(workspace: string): Promise<Member[]> {
      // The members and their teams are asked together: neither read needs the other (D-143).
      const [rows, byMember] = await Promise.all([
        all(`SELECT * FROM "members" WHERE "workspace" = ? ORDER BY "email"`, workspace),
        teamsByMember(workspace),
      ]);
      return rows.map((r) => toMember(r, byMember.get(String(r.id)) ?? []));
    },

    // ---- members, invitations and allowed domains (D-049). Every change writes its audit line in
    // the same batch (kind `access`, subject `member:<what>`).
    /** The member with this email (compared case-insensitively), whoever their provider is. */
    async findMemberByEmail(workspace: string, email: string): Promise<Member | undefined> {
      const row = await first(
        `SELECT * FROM "members" WHERE "workspace" = ? AND lower("email") = ?`,
        workspace,
        email.toLowerCase(),
      );
      return row ? toMember(row, await teamsOf(workspace, String(row.id))) : undefined;
    },
    /**
     * Replaces the teams a member is in. Each team added or removed is a change of who holds its
     * permissions: the actor (`actorPermissions`, their platform permissions) may only make it for a
     * team whose permissions they hold. The last member of `admin` cannot leave it.
     */
    async setMemberTeams(
      workspace: string,
      id: string,
      teamIds: readonly string[],
      actor: string,
      actorPermissions: readonly string[],
      /** Through which door the change came, when it is not the console (`VIA_FORGERON_MCP`). */
      via?: string,
    ): Promise<Member> {
      const member = await this.findMember(workspace, id);
      if (!member) throw new RegistryError("NOT_FOUND", `${id} is not a member of ${workspace}.`);
      const wanted = [...new Set(teamIds)].sort();
      const known = await knownTeams(workspace, wanted);
      const unknown = wanted.find((t) => !known.includes(t));
      if (unknown !== undefined) {
        throw new RegistryError("INVALID", `${unknown} is not a team of ${workspace}.`);
      }
      const changed = [
        ...wanted.filter((t) => !member.teams.includes(t)),
        ...member.teams.filter((t) => !wanted.includes(t)),
      ];
      for (const team of changed) {
        teams.requireMayGrant(
          actorPermissions,
          (await teams.findTeam(workspace, team))!.permissions,
        );
      }
      if (member.teams.includes(ADMIN_TEAM) && !wanted.includes(ADMIN_TEAM)) {
        await this.requireOtherAdmin(workspace, id);
      }
      await d1.batch([
        d1
          .prepare(`DELETE FROM "team_members" WHERE "workspace" = ? AND "member_id" = ?`)
          .bind(workspace, id),
        ...wanted.map((team) =>
          d1
            .prepare(
              `INSERT INTO "team_members" ("workspace", "team_id", "member_id") VALUES (?, ?, ?)`,
            )
            .bind(workspace, team, id),
        ),
        auditStatement(
          {
            actor,
            interface: "api",
            ...(via ? { via } : {}),
            kind: "access",
            subject: "member:teams",
            detail: { workspace, member: id, email: member.email, from: member.teams, to: wanted },
          },
          now(),
        ),
      ]);
      return { ...member, teams: wanted };
    },
    /** Removes a member. Their sessions and tokens stop working at once. */
    async removeMember(workspace: string, id: string, actor: string): Promise<void> {
      const member = await this.findMember(workspace, id);
      if (!member) throw new RegistryError("NOT_FOUND", `${id} is not a member of ${workspace}.`);
      if (member.teams.includes(ADMIN_TEAM)) await this.requireOtherAdmin(workspace, id);
      // What the person gave the workspace's tools goes with them (D-097): their plain values and
      // their sealed secrets. The rows are the secrets module's, written here in the same batch so
      // that a removed person never leaves personal data behind.
      await d1.batch([
        d1
          .prepare(
            `DELETE FROM "user_setup" WHERE "person" = ? AND "tool_id" IN (SELECT "id" FROM "tools" WHERE "workspace" = ?)`,
          )
          .bind(id, workspace),
        // The person's registry of secrets (D-104): the bindings, the versions, then the secrets.
        d1
          .prepare(
            `DELETE FROM "secret_bindings" WHERE "person" = ? AND "secret_id" IN (SELECT "id" FROM "person_secrets" WHERE "workspace" = ? AND "person" = ?)`,
          )
          .bind(id, workspace, id),
        d1
          .prepare(
            `DELETE FROM "person_secret_versions" WHERE "secret_id" IN (SELECT "id" FROM "person_secrets" WHERE "workspace" = ? AND "person" = ?)`,
          )
          .bind(workspace, id),
        d1
          .prepare(`DELETE FROM "person_secrets" WHERE "workspace" = ? AND "person" = ?`)
          .bind(workspace, id),
        d1
          .prepare(`DELETE FROM "team_members" WHERE "workspace" = ? AND "member_id" = ?`)
          .bind(workspace, id),
        d1.prepare(`DELETE FROM "members" WHERE "workspace" = ? AND "id" = ?`).bind(workspace, id),
        auditStatement(
          {
            actor,
            interface: "api",
            kind: "access",
            subject: "member:remove",
            detail: { workspace, member: id, email: member.email, teams: member.teams },
          },
          now(),
        ),
      ]);
    },
    // ---- avatars (D-133)
    /** The picture the member has, ready to serve; `undefined` when they have none. */
    async readAvatar(
      workspace: string,
      id: string,
    ): Promise<{ contentType: string; bytes: Uint8Array; version: string } | undefined> {
      const row = await first(
        `SELECT "avatar_custom", "avatar_provider", "avatar_version" FROM "members" WHERE "workspace" = ? AND "id" = ?`,
        workspace,
        id,
      );
      const data = text(row?.avatar_custom) || text(row?.avatar_provider);
      const found = data ? IMAGE.exec(data) : null;
      if (!row || !found) return undefined;
      const binary = atob(found[2]!);
      return {
        contentType: found[1]!,
        bytes: Uint8Array.from(binary, (c) => c.charCodeAt(0)),
        version: String(row.avatar_version ?? "0"),
      };
    },
    /** The provider address the stored provider picture was copied from. */
    async providerAvatarUrl(workspace: string, id: string): Promise<string | undefined> {
      const row = await first(
        `SELECT "avatar_provider_url" FROM "members" WHERE "workspace" = ? AND "id" = ?`,
        workspace,
        id,
      );
      return row?.avatar_provider_url ? String(row.avatar_provider_url) : undefined;
    },
    /** Keeps the provider's picture, copied by the gateway at sign-in. Not audited: it happens at each sign-in. */
    async setProviderAvatar(
      workspace: string,
      id: string,
      picture: { url: string; dataUrl: string },
    ): Promise<void> {
      if (!IMAGE.test(picture.dataUrl) || picture.dataUrl.length > MAX_IMAGE_BASE64 + 40) {
        throw new RegistryError("INVALID", "A picture is a png, jpeg or webp of 64 KB at most.");
      }
      await write(
        `UPDATE "members" SET "avatar_provider" = ?, "avatar_provider_url" = ?, "avatar_version" = ? WHERE "workspace" = ? AND "id" = ?`,
        picture.dataUrl,
        picture.url,
        newId(),
        workspace,
        id,
      );
    },
    /** The picture the person chose, or `null` to give it back to their provider's. */
    async setCustomAvatar(
      workspace: string,
      id: string,
      dataUrl: string | null,
      actor: string,
    ): Promise<void> {
      const member = await this.findMember(workspace, id);
      if (!member) throw new RegistryError("NOT_FOUND", `${id} is not a member of ${workspace}.`);
      if (dataUrl !== null && (!IMAGE.test(dataUrl) || dataUrl.length > MAX_IMAGE_BASE64 + 40)) {
        throw new RegistryError("INVALID", "A picture is a png, jpeg or webp of 64 KB at most.");
      }
      await d1.batch([
        d1
          .prepare(
            `UPDATE "members" SET "avatar_custom" = ?, "avatar_version" = ? WHERE "workspace" = ? AND "id" = ?`,
          )
          .bind(dataUrl, newId(), workspace, id),
        auditStatement(
          {
            actor,
            interface: "api",
            kind: "access",
            subject: "member:avatar",
            detail: { workspace, member: id, set: dataUrl !== null },
          },
          now(),
        ),
      ]);
    },
    async requireOtherAdmin(workspace: string, except: string): Promise<void> {
      if ((await otherAdmins(workspace, except)) === 0) {
        throw new RegistryError("LAST_ADMIN", "A workspace needs at least one administrator.");
      }
    },

    /**
     * Invites an email into teams (none: a person of everyone only); inviting it again replaces the
     * invitation and its expiry. Like a change of teams, it is limited to what the inviter holds
     * (`actorPermissions`).
     */
    async inviteMember(
      workspace: string,
      input: {
        email: string;
        teams: readonly string[];
        invitedBy: string;
        expiresAt: Date;
        actorPermissions: readonly string[];
      },
    ): Promise<Invitation> {
      const email = input.email.trim().toLowerCase();
      const invitedTeams = await requireTeams(workspace, input.teams, input.actorPermissions);
      if (await this.findMemberByEmail(workspace, email)) {
        throw new RegistryError("ALREADY_EXISTS", `${email} is already a member.`);
      }
      const at = now();
      const invitation: Invitation = {
        workspace,
        email,
        teams: invitedTeams,
        invitedBy: input.invitedBy,
        createdAt: at,
        expiresAt: input.expiresAt.toISOString(),
      };
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "invitations" ("workspace", "email", "teams", "invited_by", "created_at", "expires_at") VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("workspace", "email") DO UPDATE SET "teams" = excluded."teams", "invited_by" = excluded."invited_by", "created_at" = excluded."created_at", "expires_at" = excluded."expires_at"`,
          )
          .bind(
            workspace,
            email,
            JSON.stringify(invitedTeams),
            input.invitedBy,
            at,
            invitation.expiresAt,
          ),
        auditStatement(
          {
            actor: input.invitedBy,
            interface: "api",
            kind: "access",
            subject: "member:invite",
            detail: { workspace, email, teams: invitedTeams },
          },
          at,
        ),
      ]);
      return invitation;
    },
    /** The invitation of this email, unless it has expired. */
    async findInvitation(workspace: string, email: string): Promise<Invitation | undefined> {
      const row = await first(
        `SELECT * FROM "invitations" WHERE "workspace" = ? AND "email" = ? AND "expires_at" > ?`,
        workspace,
        email.toLowerCase(),
        now(),
      );
      return row ? toInvitation(row) : undefined;
    },
    async listInvitations(workspace: string): Promise<Invitation[]> {
      return (
        await all(
          `SELECT * FROM "invitations" WHERE "workspace" = ? AND "expires_at" > ? ORDER BY "email"`,
          workspace,
          now(),
        )
      ).map(toInvitation);
    },
    async revokeInvitation(workspace: string, email: string, actor: string): Promise<boolean> {
      const lower = email.toLowerCase();
      if (
        !(await first(
          `SELECT 1 FROM "invitations" WHERE "workspace" = ? AND "email" = ?`,
          workspace,
          lower,
        ))
      ) {
        return false;
      }
      await d1.batch([
        d1
          .prepare(`DELETE FROM "invitations" WHERE "workspace" = ? AND "email" = ?`)
          .bind(workspace, lower),
        auditStatement(
          {
            actor,
            interface: "api",
            kind: "access",
            subject: "member:revoke-invitation",
            detail: { workspace, email: lower },
          },
          now(),
        ),
      ]);
      return true;
    },

    /**
     * Makes the person who proved an email a member (subject `email:<address>`), in one batch with
     * its audit line and, for an invitation, the invitation's removal. Two sign-ins at once make
     * one member: the loser of the race gets the winner's row.
     */
    async joinMember(input: {
      workspace: string;
      email: string;
      /** The teams the person joins; one that does not exist (deleted since) is left out. */
      teams: readonly string[];
      via: JoinVia;
      /** A provider's own id for the person; `email:<address>` when they came by email alone. */
      subject?: string;
      name?: string;
    }): Promise<Member> {
      const email = input.email.toLowerCase();
      const memberTeams = await knownTeams(input.workspace, input.teams);
      const member: Member = {
        workspace: input.workspace,
        id: newId(),
        subject: input.subject ?? `email:${email}`,
        email,
        name: input.name ?? email.split("@")[0] ?? email,
        teams: memberTeams,
      };
      const at = now();
      try {
        await d1.batch([
          d1
            .prepare(
              `INSERT INTO "members" ("workspace", "id", "subject", "email", "name", "created_at") VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .bind(member.workspace, member.id, member.subject, member.email, member.name, at),
          ...memberTeams.map((team) =>
            d1
              .prepare(
                `INSERT INTO "team_members" ("workspace", "team_id", "member_id") VALUES (?, ?, ?)`,
              )
              .bind(member.workspace, team, member.id),
          ),
          ...(input.via === "invitation"
            ? [
                d1
                  .prepare(`DELETE FROM "invitations" WHERE "workspace" = ? AND "email" = ?`)
                  .bind(input.workspace, email),
              ]
            : []),
          auditStatement(
            {
              actor: member.id,
              interface: "web",
              kind: "access",
              subject: "member:join",
              detail: { workspace: input.workspace, email, teams: memberTeams, via: input.via },
            },
            at,
          ),
        ]);
      } catch (error) {
        const winner = await this.findMemberByEmail(input.workspace, email);
        if (winner && /UNIQUE|constraint/i.test(String(error))) return winner;
        throw error;
      }
      return member;
    },

    /** The email domains whose people join by themselves, if an admin saved them (else the install's). */
    async getMembershipSettings(workspace: string): Promise<MembershipSettings | undefined> {
      const row = await first(
        `SELECT * FROM "membership_settings" WHERE "workspace" = ?`,
        workspace,
      );
      if (!row) return undefined;
      return {
        domains: json(row.domains) as string[],
        defaultTeams: (json(row.default_teams) as string[] | null) ?? [],
      };
    },
    /**
     * Saves the allowed domains and the teams their people join as a whole. `admin` is never a
     * default team, and the actor may only name teams whose permissions they hold
     * (`actorPermissions`).
     */
    async setMembershipSettings(
      workspace: string,
      settings: MembershipSettings,
      actor: string,
      actorPermissions: readonly string[],
    ): Promise<MembershipSettings> {
      const domains = [...new Set(settings.domains.map((d) => d.trim().toLowerCase()))];
      if (domains.some((d) => !DOMAIN.test(d))) {
        throw new RegistryError("INVALID", "Domains look like acme.fr (no @, no spaces).");
      }
      if (settings.defaultTeams.includes(ADMIN_TEAM)) {
        throw new RegistryError("INVALID", "People who join by domain cannot join the admin team.");
      }
      const defaultTeams = await requireTeams(workspace, settings.defaultTeams, actorPermissions);
      const before = await this.getMembershipSettings(workspace);
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "membership_settings" ("workspace", "domains", "default_teams", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?)
         ON CONFLICT ("workspace") DO UPDATE SET "domains" = excluded."domains", "default_teams" = excluded."default_teams", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
          )
          .bind(workspace, JSON.stringify(domains), JSON.stringify(defaultTeams), actor, at),
        auditStatement(
          {
            actor,
            interface: "api",
            kind: "access",
            subject: "member:domains",
            detail: { workspace, from: before ?? null, to: { domains, defaultTeams } },
          },
          at,
        ),
      ]);
      return { domains, defaultTeams };
    },
  };
}
