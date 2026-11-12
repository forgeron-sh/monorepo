import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { json, text } from "../../kernel/rows";
import { toInvitation, toMember } from "./types";
import type { Member, Invitation, MembershipSettings, JoinVia } from "./types";

const ROLE = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;
const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function createMembers(kernel: Kernel) {
  const { d1, now, newId, all, first, write, auditStatement } = kernel;
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

    async listMembers(workspace: string): Promise<Member[]> {
      return (
        await all(`SELECT * FROM "members" WHERE "workspace" = ? ORDER BY "email"`, workspace)
      ).map(toMember);
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
      return row ? toMember(row) : undefined;
    },
    /** Replaces a member's roles. The last administrator cannot lose the role. */
    async setMemberRoles(
      workspace: string,
      id: string,
      roles: readonly string[],
      actor: string,
      /** Through which door the change came, when it is not the console (`VIA_FORGERON_MCP`). */
      via?: string,
    ): Promise<Member> {
      const clean = [...new Set(roles)];
      if (clean.some((r) => !ROLE.test(r))) {
        throw new RegistryError("INVALID", "A role is a name of letters, digits, - and _.");
      }
      if (clean.some((r) => r.startsWith("team-"))) {
        throw new RegistryError(
          "INVALID",
          "A role cannot start with team-: that is how a team is named in the access matrix.",
        );
      }
      const member = await this.findMember(workspace, id);
      if (!member) throw new RegistryError("NOT_FOUND", `${id} is not a member of ${workspace}.`);
      if (member.roles.includes("admin") && !clean.includes("admin")) {
        await this.requireOtherAdmin(workspace, id);
      }
      await d1.batch([
        d1
          .prepare(`UPDATE "members" SET "roles" = ? WHERE "workspace" = ? AND "id" = ?`)
          .bind(JSON.stringify(clean), workspace, id),
        auditStatement(
          {
            actor,
            interface: "api",
            ...(via ? { via } : {}),
            kind: "access",
            subject: "member:roles",
            detail: { workspace, member: id, email: member.email, from: member.roles, to: clean },
          },
          now(),
        ),
      ]);
      return { ...member, roles: clean };
    },
    /** Removes a member. Their sessions and tokens stop working at once. */
    async removeMember(workspace: string, id: string, actor: string): Promise<void> {
      const member = await this.findMember(workspace, id);
      if (!member) throw new RegistryError("NOT_FOUND", `${id} is not a member of ${workspace}.`);
      if (member.roles.includes("admin")) await this.requireOtherAdmin(workspace, id);
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
            detail: { workspace, member: id, email: member.email, roles: member.roles },
          },
          now(),
        ),
      ]);
    },
    async requireOtherAdmin(workspace: string, except: string): Promise<void> {
      const others = (await this.listMembers(workspace)).filter(
        (m) => m.id !== except && m.roles.includes("admin"),
      );
      if (others.length === 0) {
        throw new RegistryError("LAST_ADMIN", "A workspace needs at least one administrator.");
      }
    },

    /** Invites an email with roles; inviting it again replaces the invitation and its expiry. */
    async inviteMember(
      workspace: string,
      input: { email: string; roles: readonly string[]; invitedBy: string; expiresAt: Date },
    ): Promise<Invitation> {
      const email = input.email.trim().toLowerCase();
      const roles = [...new Set(input.roles)];
      if (roles.some((r) => !ROLE.test(r))) {
        throw new RegistryError("INVALID", "A role is a name of letters, digits, - and _.");
      }
      if (await this.findMemberByEmail(workspace, email)) {
        throw new RegistryError("ALREADY_EXISTS", `${email} is already a member.`);
      }
      const at = now();
      const invitation: Invitation = {
        workspace,
        email,
        roles,
        invitedBy: input.invitedBy,
        createdAt: at,
        expiresAt: input.expiresAt.toISOString(),
      };
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "invitations" ("workspace", "email", "roles", "invited_by", "created_at", "expires_at") VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("workspace", "email") DO UPDATE SET "roles" = excluded."roles", "invited_by" = excluded."invited_by", "created_at" = excluded."created_at", "expires_at" = excluded."expires_at"`,
          )
          .bind(workspace, email, JSON.stringify(roles), input.invitedBy, at, invitation.expiresAt),
        auditStatement(
          {
            actor: input.invitedBy,
            interface: "api",
            kind: "access",
            subject: "member:invite",
            detail: { workspace, email, roles },
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
      roles: readonly string[];
      via: JoinVia;
      /** A provider's own id for the person; `email:<address>` when they came by email alone. */
      subject?: string;
      name?: string;
    }): Promise<Member> {
      const email = input.email.toLowerCase();
      const member: Member = {
        workspace: input.workspace,
        id: newId(),
        subject: input.subject ?? `email:${email}`,
        email,
        name: input.name ?? email.split("@")[0] ?? email,
        roles: [...input.roles],
      };
      const at = now();
      try {
        await d1.batch([
          d1
            .prepare(
              `INSERT INTO "members" ("workspace", "id", "subject", "email", "name", "roles", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              member.workspace,
              member.id,
              member.subject,
              member.email,
              member.name,
              JSON.stringify(member.roles),
              at,
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
              detail: { workspace: input.workspace, email, roles: member.roles, via: input.via },
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
      const defaultRole = text(row.default_role);
      return {
        domains: json(row.domains) as string[],
        ...(defaultRole ? { defaultRole } : {}),
      };
    },
    /** Saves the allowed domains and default role as a whole; `admin` is never a default role. */
    async setMembershipSettings(
      workspace: string,
      settings: MembershipSettings,
      actor: string,
    ): Promise<MembershipSettings> {
      const domains = [...new Set(settings.domains.map((d) => d.trim().toLowerCase()))];
      if (domains.some((d) => !DOMAIN.test(d))) {
        throw new RegistryError("INVALID", "Domains look like acme.fr (no @, no spaces).");
      }
      if (settings.defaultRole !== undefined) {
        if (!ROLE.test(settings.defaultRole) || settings.defaultRole === "admin") {
          throw new RegistryError("INVALID", "The default role is a role name other than admin.");
        }
      }
      const before = await this.getMembershipSettings(workspace);
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "membership_settings" ("workspace", "domains", "default_role", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?)
         ON CONFLICT ("workspace") DO UPDATE SET "domains" = excluded."domains", "default_role" = excluded."default_role", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
          )
          .bind(workspace, JSON.stringify(domains), settings.defaultRole ?? null, actor, at),
        auditStatement(
          {
            actor,
            interface: "api",
            kind: "access",
            subject: "member:domains",
            detail: { workspace, from: before ?? null, to: { ...settings, domains } },
          },
          at,
        ),
      ]);
      return { domains, ...(settings.defaultRole ? { defaultRole: settings.defaultRole } : {}) };
    },
  };
}
