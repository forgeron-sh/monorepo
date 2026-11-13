import { ADMIN_TEAM, subjectsOf } from "@forgeron/permissions";
import type { Member, Registry } from "@forgeron/registry";
import type { Person } from "../../kernel/person";
import { refreshProviderAvatar } from "../avatar";
import type { Identity } from "./identity";
import { readSession } from "./session";
import { verifyToken } from "./tokens";
import { audienceOf, parseAudience } from "./audience";

// The one resolver of "who is calling" for a workspace: a valid session cookie or a valid
// audience-bound token (issued for this workspace) gives the person, their teams and what they may do
// on the platform; anything else, a deployment token included, gives nobody. Teams and permissions are
// read now, never frozen in the credential. Every person is part of `everyone` on top of their teams
// (D-137): `subjectsOf` is the one place it is added, so tools, the catalog, the library and the
// console all see the same subjects.

/** The scope of a CLI token (D-028): good on the platform's routes, refused by every tool. */
export const CLI_SCOPE = "cli";

/** The scope of a token an MCP client got through OAuth (D-094): good on the admin MCP and nowhere else. */
export const MCP_SCOPE = "mcp";

/** A tool's MCP path, `/t/<tool>/mcp` or `/t/<tool>@<branch>/mcp`: the only place an `mcp` tool token works. */
const TOOL_MCP = /^\/t\/([a-z0-9][a-z0-9-]*)(?:@[^/]+)?\/mcp\/?$/;

export interface CallerOptions {
  registry: Pick<
    Registry,
    | "addMember"
    | "findInvitation"
    | "findMember"
    | "findMemberByEmail"
    | "findMemberBySubject"
    | "isTokenRevoked"
    | "joinMember"
    | "platformPermissionsOf"
  >;
  secret: string;
  /** Keys tokens were signed with before a rotation (`AUTH_SECRET_PREVIOUS`, D-035). */
  previousSecrets?: string[];
  now(): Date;
}

/** Who a request is, and for which tool when a token says so (a session has no audience). */
export interface Resolved {
  person: Person;
  audience?: string;
}

export function createCaller(options: CallerOptions) {
  const toPerson = async (member: Member): Promise<Person> => ({
    id: member.id,
    email: member.email,
    name: member.name,
    teams: member.teams,
    subjects: subjectsOf(member.teams),
    permissions: await options.registry.platformPermissionsOf(member.workspace, member.id),
  });
  const personOf = async (workspace: string, id: string) => {
    const member = await options.registry.findMember(workspace, id);
    return member ? toPerson(member) : undefined;
  };

  return {
    /**
     * The person behind a request to this workspace, by session cookie, else by Bearer token, with
     * the audience the token was issued for. A revoked token is nobody (D-035).
     */
    async identify(
      request: Request,
      workspace: string,
      /** Also accept a CLI token (`forgeron login`): for the platform's own routes only. */
      platform = false,
    ): Promise<Resolved | undefined> {
      const now = options.now();
      const session = await readSession(request, { secret: options.secret, workspace, now });
      if (session) {
        const person = await personOf(workspace, session.person);
        return person ? { person } : undefined;
      }

      const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
      if (!token) return undefined;
      const keys = {
        secret: options.secret,
        ...(options.previousSecrets ? { previousSecrets: options.previousSecrets } : {}),
        now,
      };
      let check = await verifyToken(token, keys);
      if (!check.ok && platform) check = await verifyToken(token, { ...keys, scope: CLI_SCOPE });
      // A token an MCP client got through OAuth for one tool (D-095): good on that tool's `/mcp` and on
      // no other path, whatever the tool, and never for another tool.
      if (!check.ok) {
        const tool = TOOL_MCP.exec(new URL(request.url).pathname)?.[1];
        if (tool) {
          const scoped = await verifyToken(token, { ...keys, scope: MCP_SCOPE });
          if (scoped.ok && scoped.claims.aud === audienceOf(workspace, tool)) check = scoped;
        }
      }
      if (!check.ok || parseAudience(check.claims.aud)?.workspace !== workspace) return undefined;
      const { sub, jti, iat, aud } = check.claims;
      if (await options.registry.isTokenRevoked(workspace, sub, jti, iat)) return undefined;
      const person = await personOf(workspace, sub);
      return person ? { person, audience: aud } : undefined;
    },
    /** The person behind a request, by session cookie, else by Bearer token. */
    async resolve(request: Request, workspace: string, platform = false) {
      return (await this.identify(request, workspace, platform))?.person;
    },
    /**
     * The person of a CLI token sent as a Bearer, and of nothing else: no cookie (a browser could
     * be made to send it), no token issued for a tool. What the admin MCP trusts (D-079).
     */
    async cliBearer(request: Request, workspace: string): Promise<Person | undefined> {
      const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
      if (!token) return undefined;
      const check = await verifyToken(token, {
        secret: options.secret,
        ...(options.previousSecrets ? { previousSecrets: options.previousSecrets } : {}),
        now: options.now(),
        scope: CLI_SCOPE,
      });
      if (!check.ok || parseAudience(check.claims.aud)?.workspace !== workspace) return undefined;
      const { sub, jti, iat } = check.claims;
      if (await options.registry.isTokenRevoked(workspace, sub, jti, iat)) return undefined;
      return personOf(workspace, sub);
    },
    /**
     * What the admin MCP trusts (D-079, D-094): the person of a Bearer that is a CLI token or a token
     * an MCP client got through OAuth, and of nothing else. A token with the `mcp` scope is refused
     * by every other route, because the other routes ask for no scope or for `cli`.
     */
    async mcpBearer(request: Request, workspace: string): Promise<Person | undefined> {
      const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
      if (!token) return undefined;
      for (const scope of [MCP_SCOPE, CLI_SCOPE]) {
        const check = await verifyToken(token, {
          secret: options.secret,
          ...(options.previousSecrets ? { previousSecrets: options.previousSecrets } : {}),
          now: options.now(),
          scope,
        });
        if (!check.ok) continue;
        // The admin MCP is the platform's: a token for a tool (D-095) is not good here.
        if (check.claims.aud !== audienceOf(workspace, "platform")) return undefined;
        const { sub, jti, iat } = check.claims;
        if (await options.registry.isTokenRevoked(workspace, sub, jti, iat)) return undefined;
        return personOf(workspace, sub);
      }
      return undefined;
    },
    /** The person of a valid session cookie only (a token cannot mint a longer-lived token). */
    async session(request: Request, workspace: string): Promise<Person | undefined> {
      const session = await readSession(request, {
        secret: options.secret,
        workspace,
        now: options.now(),
      });
      return session ? personOf(workspace, session.person) : undefined;
    },
  };
}

export interface MembershipPolicy {
  /** This email joins the team `admin` at its first sign-in. */
  adminEmail?: string;
  /** Anyone signing in with an email of one of these domains becomes a member, in no team. */
  memberDomains: string[];
  /** The teams a person joining by domain joins (D-049); none when empty or `undefined`. */
  defaultTeams?: string[];
  /**
   * The team each group of the provider puts a person in (D-041). A person in one of these groups is
   * admitted; teams are set at the first sign-in only, and read from the registry afterwards.
   */
  groupTeams?: Record<string, string>;
}

/**
 * `resolvePerson` of the sign-in (D-027): an existing member by their provider subject; else the
 * email named by the policy, who joins the team `admin`; else a member of an allowed email domain; else nobody.
 */
export function membership(
  registry: Pick<
    Registry,
    | "addMember"
    | "findInvitation"
    | "findMemberByEmail"
    | "findMemberBySubject"
    | "joinMember"
    | "providerAvatarUrl"
    | "setProviderAvatar"
  >,
  policy: MembershipPolicy,
  /** Fetches a provider's picture; the global `fetch` by default (D-133). */
  fetchImage?: Parameters<typeof refreshProviderAvatar>[4],
) {
  // The provider's picture is copied at each sign-in where it changed: best effort, never a refusal.
  const withPicture = async <M extends { id: string }>(
    workspace: string,
    identity: Identity,
    member: M,
  ) => {
    await refreshProviderAvatar(registry, workspace, member.id, identity.picture, fetchImage);
    return member;
  };
  return async (workspace: string, identity: Identity): Promise<{ id: string } | undefined> => {
    const known = await registry.findMemberBySubject(workspace, identity.subject);
    if (known) return withPicture(workspace, identity, known);
    const email = identity.email.toLowerCase();
    // The same person who came by email first (D-049): one member, not two.
    const sameEmail = await registry.findMemberByEmail(workspace, email);
    if (sameEmail) return withPicture(workspace, identity, sameEmail);
    const fromGroups = [
      ...new Set(
        identity.groups.flatMap((group) => {
          const team = policy.groupTeams?.[group];
          return team ? [team] : [];
        }),
      ),
    ];
    const invitation = await registry.findInvitation(workspace, email);
    const base = invitation
      ? invitation.teams
      : policy.adminEmail && email === policy.adminEmail.toLowerCase()
        ? [ADMIN_TEAM]
        : policy.memberDomains.includes(email.split("@")[1] ?? "")
          ? (policy.defaultTeams ?? [])
          : undefined;
    const teams =
      base === undefined && fromGroups.length === 0
        ? undefined
        : [...new Set([...(base ?? []), ...fromGroups])];
    if (!teams) return undefined;
    // An invitation is accepted by signing in with its email, whichever way the provider is.
    if (invitation) {
      return withPicture(
        workspace,
        identity,
        await registry.joinMember({
          workspace,
          email: identity.email,
          teams,
          via: "invitation",
          subject: identity.subject,
          name: identity.name,
        }),
      );
    }
    return withPicture(
      workspace,
      identity,
      await registry.addMember({
        workspace,
        subject: identity.subject,
        email: identity.email,
        name: identity.name,
        teams,
      }),
    );
  };
}
