import { seal, unseal } from "./sealed";

// The workspace session (sdk.md §7, Isolation point 4): an `HttpOnly`, `Secure`, `SameSite=Lax`
// cookie reserved for the console and the identity gateway. The `__Host-` prefix makes the browser
// refuse it unless it is `Secure`, on `/`, and without a `Domain`: no sibling subdomain can set it.

export const SESSION_COOKIE = "__Host-fg_session";
const PREFIX = "fgs";

export interface Session {
  /** The person's id in the workspace. */
  person: string;
  workspace: string;
}

const attributes = (maxAge: number) =>
  `Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAge))}`;

/** The `Set-Cookie` of a new session. No default lifetime: the caller decides. */
export async function openSession(
  session: Session,
  options: { secret: string; ttlSeconds: number; now: Date },
): Promise<string> {
  if (!(options.ttlSeconds > 0)) throw new Error("A session needs a positive lifetime.");
  const iat = Math.floor(options.now.getTime() / 1000);
  const value = await seal(
    PREFIX,
    { sub: session.person, ws: session.workspace, iat, exp: iat + options.ttlSeconds },
    options.secret,
  );
  return `${SESSION_COOKIE}=${value}; ${attributes(options.ttlSeconds)}`;
}

/** The `Set-Cookie` that ends the session. */
export const closeSession = () => `${SESSION_COOKIE}=; ${attributes(0)}`;

export function cookieOf(request: Request, name: string): string | undefined {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

/** The session of a request for this workspace: signed, not expired, and opened in this workspace. */
export async function readSession(
  request: Request,
  options: { secret: string; workspace: string; now: Date },
): Promise<Session | undefined> {
  const value = cookieOf(request, SESSION_COOKIE);
  if (!value) return undefined;
  const claims = await unseal(PREFIX, value, options.secret);
  if (!claims) return undefined;
  const { sub, ws, exp } = claims;
  if (typeof sub !== "string" || typeof ws !== "string" || typeof exp !== "number")
    return undefined;
  if (options.now.getTime() / 1000 >= exp) return undefined;
  // A session opened for one workspace is no session in another.
  if (ws !== options.workspace) return undefined;
  return { person: sub, workspace: ws };
}
