import type { Row } from "../../kernel/rows";
import { json } from "../../kernel/rows";

/** A person of a workspace; `subject` is their id at the identity provider. */
export interface Member {
  workspace: string;
  id: string;
  subject: string;
  email: string;
  name: string;
  /** The ids of the teams the person is in (D-137), by id. Everyone is also part of `everyone`, which is not stored. */
  teams: string[];
  /** Which picture the person has: the one they chose, else their provider's; changes with it (D-133). */
  avatar?: { source: "custom" | "provider"; version: string };
}

/** An invitation to join a workspace in these teams, accepted by signing in with the email (D-049). */
export interface Invitation {
  workspace: string;
  email: string;
  teams: string[];
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

/** Who joins a workspace by email domain, and in which teams (D-049). */
export interface MembershipSettings {
  domains: string[];
  /** The teams a person joining by domain is put in. Never `admin`. */
  defaultTeams: string[];
}

/** How a person came to be a member through the sign-in by email. */
export type JoinVia = "invitation" | "admin-email" | "domain";

export const toInvitation = (r: Row): Invitation => ({
  workspace: String(r.workspace),
  email: String(r.email),
  teams: json(r.teams) as string[],
  invitedBy: String(r.invited_by),
  createdAt: String(r.created_at),
  expiresAt: String(r.expires_at),
});

export const toMember = (r: Row, teams: string[]): Member => ({
  workspace: String(r.workspace),
  id: String(r.id),
  subject: String(r.subject),
  email: String(r.email),
  name: String(r.name),
  teams,
  ...(r.avatar_custom || r.avatar_provider
    ? {
        avatar: {
          source: r.avatar_custom ? ("custom" as const) : ("provider" as const),
          version: String(r.avatar_version ?? "0"),
        },
      }
    : {}),
});
