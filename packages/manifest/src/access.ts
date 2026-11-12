// The one access rule, shared by the runtime (actions), the gateway (views, playground) and the
// registry (catalog, matrix). D-127: a tool declares permissions (the levels its actions and views
// require) and profiles (named sets of them); the workspace maps each of its roles to a profile, a
// custom set of permissions, all of them, or nothing. A role may use a subject if the console's
// per-action matrix says so, else if the subject's level is among the role's permissions. The
// person may if one of their roles may. A subject is an action name, or `view:<name>` for a view.

/** The overrides of the matrix that apply to a person: `role -> subject -> allowed`. */
export type AccessOverrides = Record<string, Record<string, boolean>>;

/** The tool permissions each of a person's workspace roles is mapped to: `role -> permissions`. */
export type RolePermissions = Record<string, readonly string[]>;

/** The profiles a tool declares (the manifest's `roles`). */
export type Profiles = Record<
  string,
  { label?: string; grants: readonly string[]; default?: boolean }
>;

/** What a workspace role is given in a tool (D-127). */
export type ProfileGrant =
  | { kind: "all" }
  | { kind: "profile"; profile: string }
  | { kind: "custom"; permissions: string[] }
  | { kind: "none" };

/** The mapping of a tool: workspace role -> what it is given. A role not in it is given nothing. */
export type AccessMapping = Record<string, ProfileGrant>;

/** The workspace role every tool maps to all of its permissions by default. */
export const ADMIN_ROLE = "admin";
/** The workspace role every tool maps to its default profile by default. */
export const MEMBER_ROLE = "member";

/** The matrix key of a view: it cannot collide with an action name, which has no colon. */
export const viewSubject = (name: string): string => `view:${name}`;

interface AccessShape {
  /** Optional only for a manifest stored before it was checked (tests, very old builds). */
  roles?: Profiles;
  actions?: Record<string, { access: string }>;
  views?: Record<string, { access: string }>;
}

/** The subjects of a tool and the level each one requires: actions, then `view:<name>` for views. */
export function subjectsOf(manifest: AccessShape): Record<string, string> {
  return {
    ...Object.fromEntries(
      Object.entries(manifest.actions ?? {}).map(([name, a]) => [name, a.access]),
    ),
    ...Object.fromEntries(
      Object.entries(manifest.views ?? {}).map(([name, v]) => [viewSubject(name), v.access]),
    ),
  };
}

/** Every permission of a tool: what its actions and views require and what its profiles name. */
export function permissionsOf(manifest: AccessShape): string[] {
  return [
    ...new Set([
      ...Object.values(subjectsOf(manifest)),
      ...Object.values(manifest.roles ?? {}).flatMap((p) => p.grants),
    ]),
  ].sort();
}

/**
 * The tool's default profile: the one marked `default: true`, else the one with the fewest
 * permissions (the first declared on a tie). `undefined` when the tool declares no profile.
 */
export function defaultProfile(profiles: Profiles = {}): string | undefined {
  const entries = Object.entries(profiles);
  const marked = entries.find(([, p]) => p.default === true);
  if (marked) return marked[0];
  let best: [string, Profiles[string]] | undefined;
  for (const entry of entries) {
    if (!best || entry[1].grants.length < best[1].grants.length) best = entry;
  }
  return best?.[0];
}

/**
 * The mapping a tool gets when it arrives (D-127): `admin` is given every permission and `member`
 * the default profile. It is written down, and an admin edits it in the tool's Access tab.
 */
export function defaultMapping(profiles: Profiles = {}): AccessMapping {
  const fallback = defaultProfile(profiles);
  return {
    [ADMIN_ROLE]: { kind: "all" },
    ...(fallback ? { [MEMBER_ROLE]: { kind: "profile", profile: fallback } } : {}),
  };
}

/** The permissions a grant gives in a tool. A profile the tool no longer declares gives nothing. */
export function grantPermissions(grant: ProfileGrant | undefined, manifest: AccessShape): string[] {
  if (!grant) return [];
  switch (grant.kind) {
    case "all":
      return permissionsOf(manifest);
    case "profile":
      return [...(manifest.roles?.[grant.profile]?.grants ?? [])];
    case "custom":
      return [...grant.permissions];
    case "none":
      return [];
  }
}

/**
 * Without the gateway (`forgeron dev --as`, tests), a role is read with the default mapping: the
 * profile of that name, else `admin` gets every permission and `member` the default profile.
 */
function localPermissions(role: string, profiles: Profiles): readonly string[] | "all" {
  const own = profiles[role];
  if (own) return own.grants;
  const grant = defaultMapping(profiles)[role];
  if (!grant) return [];
  if (grant.kind === "all") return "all";
  return grant.kind === "profile" ? (profiles[grant.profile]?.grants ?? []) : [];
}

interface Who {
  roles: readonly string[];
  /** The console's per-action matrix for the person's roles. */
  access?: AccessOverrides | undefined;
  /** The permissions the gateway mapped each role to; without it, the default mapping is read. */
  permissions?: RolePermissions | undefined;
}

function roleHas(who: Who, profiles: Profiles, role: string, level: string): boolean {
  if (who.permissions) return (who.permissions[role] ?? []).includes(level);
  const local = localPermissions(role, profiles);
  return local === "all" || local.includes(level);
}

export function mayAccess(who: Who, profiles: Profiles, subject: string, level: string): boolean {
  return who.roles.some(
    (role) => who.access?.[role]?.[subject] ?? roleHas(who, profiles, role, level),
  );
}

/**
 * The permissions a person holds in a tool, all roles together: what `ctx.user.can` and a view's
 * `useCan` read. It never decides a call: `mayAccess` does.
 */
export function heldPermissions(who: Who, manifest: AccessShape): string[] {
  const held = new Set<string>();
  for (const role of who.roles) {
    if (who.permissions) {
      for (const p of who.permissions[role] ?? []) held.add(p);
      continue;
    }
    const local = localPermissions(role, manifest.roles ?? {});
    for (const p of local === "all" ? permissionsOf(manifest) : local) held.add(p);
  }
  return [...held].sort();
}

/**
 * What the gateway forwards with a person (D-127): the permissions each of their roles is mapped to,
 * and the matrix resolved for every subject of the manifest. The resolved matrix is what a runtime
 * built before D-127 reads, so a tool keeps working without a new version.
 */
export function resolveAccess(
  roles: readonly string[],
  mapping: AccessMapping,
  overrides: AccessOverrides,
  manifest: AccessShape,
): { permissions: Record<string, string[]>; access: AccessOverrides } {
  const subjects = subjectsOf(manifest);
  const permissions: Record<string, string[]> = {};
  const access: AccessOverrides = {};
  for (const role of new Set(roles)) {
    const held = grantPermissions(mapping[role], manifest);
    permissions[role] = held;
    access[role] = Object.fromEntries(
      Object.entries(subjects).map(([subject, level]) => [
        subject,
        overrides[role]?.[subject] ?? held.includes(level),
      ]),
    );
  }
  return { permissions, access };
}
