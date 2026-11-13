// The one engine of permissions (D-137): a catalog of atomic permissions, each of which may imply
// others (`members:write` implies `members:read`), and the sets a subject is given. Everything that
// decides "may this person do that" on the platform reads it; a tool's own access (profiles, the
// matrix) is the same idea over the permissions the tool declares, in `@forgeron/manifest`.

/** Every permission of the catalog, including the ones to come: what the admin team holds. */
export const ALL = "*";

export interface PermissionDefinition<P extends string> {
  /** What the console shows: a few words. */
  label: string;
  /** One sentence: what it lets a person do. */
  description: string;
  /** The permissions it gives too. A write gives its read. */
  implies?: readonly P[];
}

export interface Catalog<P extends string> {
  readonly permissions: { readonly [K in P]: PermissionDefinition<P> };
}

export function defineCatalog<P extends string>(permissions: {
  readonly [K in P]: PermissionDefinition<NoInfer<P>>;
}): Catalog<P> {
  for (const [name, definition] of Object.entries<PermissionDefinition<P>>(permissions)) {
    for (const implied of definition.implies ?? []) {
      if (!(implied in permissions))
        throw new Error(`${name} implies ${implied}, which is unknown.`);
    }
  }
  return { permissions };
}

/** The names of a catalog, in the order it declares them. */
export function permissionNames<P extends string>(catalog: Catalog<P>): P[] {
  return Object.keys(catalog.permissions) as P[];
}

export function isPermission<P extends string>(catalog: Catalog<P>, value: string): value is P {
  return Object.hasOwn(catalog.permissions, value);
}

/**
 * What a set of granted permissions gives: each one, what it implies, and so on; `*` gives the whole
 * catalog. A name the catalog does not know gives nothing (a permission that was removed).
 */
export function expand<P extends string>(catalog: Catalog<P>, granted: Iterable<string>): Set<P> {
  const held = new Set<P>();
  const pending: string[] = [...granted];
  while (pending.length > 0) {
    const next = pending.pop() as string;
    if (next === ALL) {
      for (const name of permissionNames(catalog)) held.add(name);
      continue;
    }
    if (!isPermission(catalog, next) || held.has(next)) continue;
    held.add(next);
    pending.push(...(catalog.permissions[next].implies ?? []));
  }
  return held;
}

/** Whether these grants give the permission. */
export function holds<P extends string>(
  catalog: Catalog<P>,
  granted: Iterable<string>,
  permission: P,
): boolean {
  return expand(catalog, granted).has(permission);
}

/**
 * The permissions of a person: the union of what each of their subjects is given.
 * `grants` is `subject -> granted permissions`; a subject with no entry gives nothing.
 */
export function permissionsOfSubjects<P extends string>(
  catalog: Catalog<P>,
  subjects: readonly string[],
  grants: Readonly<Record<string, readonly string[]>>,
): Set<P> {
  return expand(
    catalog,
    subjects.flatMap((s) => grants[s] ?? []),
  );
}

/**
 * The rule against escalation: a person may give (or take away from) a team only permissions they
 * hold themselves. Returns what they lack, empty when they may. Changing who is in a team gives
 * them every permission of the team, so the same rule applies to the team's permissions as a whole.
 */
export function missingToGrant<P extends string>(
  catalog: Catalog<P>,
  held: Iterable<string>,
  wanted: Iterable<string>,
): P[] {
  const own = expand(catalog, held);
  return [...expand(catalog, wanted)].filter((p) => !own.has(p));
}

/**
 * The fewest grants that give the same: what is implied by another grant is left out, and the
 * whole catalog is `*`. What the console stores and shows.
 */
export function minimal<P extends string>(
  catalog: Catalog<P>,
  granted: Iterable<string>,
): (P | typeof ALL)[] {
  const list = [...granted];
  if (list.includes(ALL)) return [ALL];
  const held = expand(catalog, list);
  const implied = new Set<P>();
  for (const p of held) {
    for (const q of expand(catalog, catalog.permissions[p].implies ?? [])) implied.add(q);
  }
  return permissionNames(catalog).filter((p) => held.has(p) && !implied.has(p));
}
