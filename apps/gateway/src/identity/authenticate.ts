import { verifyToken, type TokenClaims } from "./tokens";

/** The person a tool's runtime sees (`@forgeron/runtime`'s `User`); roles come from the workspace. */
export interface Person {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface AuthenticatorOptions {
  secret: string;
  /** Keys tokens were signed with before a rotation (D-035). */
  previousSecrets?: string[];
  /** Is this token void (D-035)? Without it nothing is revoked. */
  revoked?(claims: TokenClaims): boolean | Promise<boolean>;
  /** Resolves the person and their roles in the workspace; `undefined` if they no longer exist. */
  resolvePerson(id: string): Person | undefined | Promise<Person | undefined>;
  now(): Date;
}

/**
 * The `authenticate` of a tool's runtime for API and CLI tokens: a valid token gives the
 * person (roles resolved now, not frozen in the token) with the audience it was issued for.
 * An unsigned, expired or unknown caller is anonymous (401). The audience is not judged
 * here: the gateway checks it before dispatch and the runtime checks it again (`audience`).
 */
export function tokenAuthenticator(options: AuthenticatorOptions) {
  return async (request: Request) => {
    const header = request.headers.get("authorization") ?? "";
    const token = /^Bearer (\S+)$/i.exec(header)?.[1];
    if (!token) return undefined;
    const check = await verifyToken(token, {
      secret: options.secret,
      ...(options.previousSecrets ? { previousSecrets: options.previousSecrets } : {}),
      now: options.now(),
    });
    if (!check.ok) return undefined;
    if (await options.revoked?.(check.claims)) return undefined;
    const user = await options.resolvePerson(check.claims.sub);
    return user ? { user, audience: check.claims.aud } : undefined;
  };
}
