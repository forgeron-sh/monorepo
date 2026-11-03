// The one access rule, shared by the runtime (actions) and the gateway (views, playground): a role
// may use a subject if the console's matrix says so, else if one of its levels is the subject's.
// The person may if one of their roles may. A subject is an action name, or `view:<name>` for a view.

/** The overrides of the matrix that apply to a person: `role -> subject -> allowed`. */
export type AccessOverrides = Record<string, Record<string, boolean>>;

/** The matrix key of a view: it cannot collide with an action name, which has no colon. */
export const viewSubject = (name: string): string => `view:${name}`;

export function mayAccess(
  who: { roles: readonly string[]; access?: AccessOverrides | undefined },
  roles: Record<string, { grants: readonly string[] }>,
  subject: string,
  level: string,
): boolean {
  return who.roles.some(
    (role) => who.access?.[role]?.[subject] ?? (roles[role]?.grants ?? []).includes(level),
  );
}
