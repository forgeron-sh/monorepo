// The one access rule, shared by the runtime (actions), the gateway (views, playground) and the
// registry (catalog, matrix). D-127, D-137: a tool declares permissions (the levels its actions and
// views require) and profiles (named sets of them); the workspace gives each subject (`everyone` or
// `team:<id>`) a profile, a custom set of permissions, all of them, or nothing. A subject may use
// an action if the console's per-action matrix says so, else if the action's level is among the
// subject's permissions. The person may if one of their subjects may. An action is named by its
// name, or `view:<name>` for a view.

import { ADMIN_TEAM, EVERYONE, teamSubject } from "@forgeron/permissions";

/** The overrides of the matrix that apply to a person: `subject -> action -> allowed`. */
export type AccessOverrides = Record<string, Record<string, boolean>>;

/** The tool permissions each of a person's subjects is given: `subject -> permissions`. */
export type SubjectPermissions = Record<string, readonly string[]>;

/** The profiles a tool declares (the manifest's `profiles`). */
export type Profiles = Record<
  string,
  { label?: string; grants: readonly string[]; default?: boolean }
>;

/** What a subject is given in a tool (D-127). */
export type ProfileGrant =
  | { kind: "all" }
  | { kind: "profile"; profile: string }
  | { kind: "custom"; permissions: string[] }
  | { kind: "none" };

/** The grants of a tool: subject -> what it is given. A subject not in it is given nothing. */
export type AccessGrants = Record<string, ProfileGrant>;

/** The matrix key of a view: it cannot collide with an action name, which has no colon. */
export const viewSubject = (name: string): string => `view:${name}`;

interface AccessShape {
  /** Optional only for a manifest stored before it was checked (tests, very old builds). */
  profiles?: Profiles;
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
      ...Object.values(manifest.profiles ?? {}).flatMap((p) => p.grants),
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
 * The grants a tool gets when it arrives (D-137): the admin team is given every permission and
 * `everyone` the default profile. They are written down, and someone who gives access edits them in
 * the tool's Access tab.
 */
export function defaultGrants(profiles: Profiles = {}): AccessGrants {
  const fallback = defaultProfile(profiles);
  return {
    [teamSubject(ADMIN_TEAM)]: { kind: "all" },
    ...(fallback ? { [EVERYONE]: { kind: "profile", profile: fallback } } : {}),
  };
}

/** The permissions a grant gives in a tool. A profile the tool no longer declares gives nothing. */
export function grantPermissions(grant: ProfileGrant | undefined, manifest: AccessShape): string[] {
  if (!grant) return [];
  switch (grant.kind) {
    case "all":
      return permissionsOf(manifest);
    case "profile":
      return [...(manifest.profiles?.[grant.profile]?.grants ?? [])];
    case "custom":
      return [...grant.permissions];
    case "none":
      return [];
  }
}

/**
 * Without the gateway (`forgeron dev`, tests), a subject is read with the default grants: the admin
 * team gets every permission and `everyone` the default profile. A run that wants a given profile
 * passes its permissions in `Who.permissions`.
 */
function localPermissions(subject: string, profiles: Profiles): readonly string[] | "all" {
  const grant = defaultGrants(profiles)[subject];
  if (!grant) return [];
  if (grant.kind === "all") return "all";
  return grant.kind === "profile" ? (profiles[grant.profile]?.grants ?? []) : [];
}

export interface Who {
  /** `everyone` and one `team:<id>` per team of the person. */
  subjects: readonly string[];
  /** The console's per-action matrix for the person's subjects. */
  access?: AccessOverrides | undefined;
  /** The permissions the gateway gave each subject; without it, the default grants are read. */
  permissions?: SubjectPermissions | undefined;
}

function subjectHas(who: Who, profiles: Profiles, subject: string, level: string): boolean {
  if (who.permissions) return (who.permissions[subject] ?? []).includes(level);
  const local = localPermissions(subject, profiles);
  return local === "all" || local.includes(level);
}

/** `action` is an action's name or `view:<name>`; `level` the permission it requires. */
export function mayAccess(who: Who, profiles: Profiles, action: string, level: string): boolean {
  return who.subjects.some(
    (subject) => who.access?.[subject]?.[action] ?? subjectHas(who, profiles, subject, level),
  );
}

/**
 * The permissions a person holds in a tool, all subjects together: what `ctx.user.can` and a view's
 * `useCan` read. It never decides a call: `mayAccess` does.
 */
export function heldPermissions(who: Who, manifest: AccessShape): string[] {
  const held = new Set<string>();
  for (const subject of who.subjects) {
    if (who.permissions) {
      for (const p of who.permissions[subject] ?? []) held.add(p);
      continue;
    }
    const local = localPermissions(subject, manifest.profiles ?? {});
    for (const p of local === "all" ? permissionsOf(manifest) : local) held.add(p);
  }
  return [...held].sort();
}

/**
 * What the gateway forwards with a person (D-137): the permissions each of their subjects is given,
 * and the matrix resolved for every action of the manifest. The resolved matrix is what a runtime
 * built before D-127 reads, so a tool keeps working without a new version.
 */
export function resolveAccess(
  subjects: readonly string[],
  grants: AccessGrants,
  overrides: AccessOverrides,
  manifest: AccessShape,
): { permissions: Record<string, string[]>; access: AccessOverrides } {
  const actions = subjectsOf(manifest);
  const permissions: Record<string, string[]> = {};
  const access: AccessOverrides = {};
  for (const subject of new Set(subjects)) {
    const held = grantPermissions(grants[subject], manifest);
    permissions[subject] = held;
    access[subject] = Object.fromEntries(
      Object.entries(actions).map(([action, level]) => [
        action,
        overrides[subject]?.[action] ?? held.includes(level),
      ]),
    );
  }
  return { permissions, access };
}
