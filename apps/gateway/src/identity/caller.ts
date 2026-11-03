import type { Member, Registry } from "@forgeron/registry";
import type { Person } from "./authenticate";
import type { Identity } from "./oidc";
import { readSession } from "./session";
import { verifyToken } from "./tokens";
import { parseAudience } from "./audience";

// The one resolver of "who is calling" for a workspace: a valid session cookie or a valid
// audience-bound token (issued for this workspace) gives the person and their roles; anything
// else, a deployment token included, gives nobody. Roles are read now, never frozen in the credential.

/** The scope of a CLI token (D-028): good on the platform's routes, refused by every tool. */
export const CLI_SCOPE = "cli";

const toPerson = (member: Member): Person => ({
  id: member.id,
  email: member.email,
  name: member.name,
  roles: member.roles,
});

export interface CallerOptions {
  registry: Registry;
  secret: string;
  now(): Date;
}

export function createCaller(options: CallerOptions) {
  const personOf = async (workspace: string, id: string) => {
    const member = await options.registry.findMember(workspace, id);
    return member ? toPerson(member) : undefined;
  };

  return {
    /** The person behind a request to this workspace, by session cookie, else by Bearer token. */
    async resolve(
      request: Request,
      workspace: string,
      /** Also accept a CLI token (`forgeron login`): for the platform's own routes only. */
      platform = false,
    ): Promise<Person | undefined> {
      const now = options.now();
      const session = await readSession(request, { secret: options.secret, workspace, now });
      if (session) return personOf(workspace, session.person);

      const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
      if (!token) return undefined;
      let check = await verifyToken(token, { secret: options.secret, now });
      if (!check.ok && platform) {
        check = await verifyToken(token, { secret: options.secret, now, scope: CLI_SCOPE });
      }
      if (!check.ok || parseAudience(check.claims.aud)?.workspace !== workspace) return undefined;
      return personOf(workspace, check.claims.sub);
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
  /** This email becomes an administrator at its first sign-in. */
  adminEmail?: string;
  /** Anyone signing in with an email of one of these domains becomes a member, with no role. */
  memberDomains: string[];
  /**
   * The role each group of the provider grants (D-037). A person in one of these groups is
   * admitted; roles are set at the first sign-in only, and read from the registry afterwards.
   */
  groupRoles?: Record<string, string>;
}

/**
 * `resolvePerson` of the sign-in (D-027): an existing member by their provider subject; else the
 * administrator named by the policy; else a member of an allowed email domain; else nobody.
 */
export function membership(registry: Registry, policy: MembershipPolicy) {
  return async (workspace: string, identity: Identity): Promise<{ id: string } | undefined> => {
    const known = await registry.findMemberBySubject(workspace, identity.subject);
    if (known) return known;
    const email = identity.email.toLowerCase();
    const fromGroups = [
      ...new Set(
        identity.groups.flatMap((group) => {
          const role = policy.groupRoles?.[group];
          return role ? [role] : [];
        }),
      ),
    ];
    const base =
      policy.adminEmail && email === policy.adminEmail.toLowerCase()
        ? ["admin"]
        : policy.memberDomains.includes(email.split("@")[1] ?? "")
          ? []
          : undefined;
    const roles =
      base === undefined && fromGroups.length === 0
        ? undefined
        : [...new Set([...(base ?? []), ...fromGroups])];
    if (!roles) return undefined;
    return registry.addMember({
      workspace,
      subject: identity.subject,
      email: identity.email,
      name: identity.name,
      roles,
    });
  };
}
