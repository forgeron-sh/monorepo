import type { User } from "./types";

/**
 * The person the gateway forwards in `x-forgeron-user`, or `undefined` for no header or one that is
 * not JSON. The gateway sends `subjects`; a gateway from before D-136 sends the same list as `roles`,
 * and `access` and `permissions` keyed by them, which read the same way.
 */
export function readGatewayUser(raw: string | null): User | undefined {
  if (!raw) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const { roles, ...rest } = parsed as Partial<User> & { roles?: string[] };
  // legacy (D-136)
  const subjects = rest.subjects ?? roles ?? [];
  return { ...rest, subjects } as User;
}
