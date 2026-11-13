// Who is given something (D-137). There are no roles: a person is in teams, and every person of the
// workspace is part of `everyone`. A grant (a tool's profile, a platform permission, an exception of
// the access matrix) names a subject; a person holds what any of their subjects holds.

/** Everyone of the workspace: what a tool gives them, every person gets. */
export const EVERYONE = "everyone";

/** A subject: everyone, or one team (`team:<id>`). */
export type Subject = typeof EVERYONE | `team:${string}`;

/** The address of a team: 2 to 34 lower-case letters, digits and `-`, starting with a letter. */
export const TEAM_ID = /^[a-z][a-z0-9-]{1,33}$/;

/** The team every workspace has, that administers it: it holds every platform permission. */
export const ADMIN_TEAM = "admin";
/** The team every workspace has for the people who build tools. */
export const DEVELOPER_TEAM = "developer";

/** A team id no admin may take: it would read as a subject that is not a team. */
const RESERVED = new Set([EVERYONE]);

export function isTeamId(id: string): boolean {
  return TEAM_ID.test(id) && !RESERVED.has(id);
}

export const teamSubject = (id: string): Subject => `team:${id}`;

/** The team a subject names, `undefined` for `everyone` or anything that is not a subject. */
export function teamOf(subject: string): string | undefined {
  if (!subject.startsWith("team:")) return undefined;
  const id = subject.slice("team:".length);
  return isTeamId(id) ? id : undefined;
}

export function isSubject(value: string): value is Subject {
  return value === EVERYONE || teamOf(value) !== undefined;
}

/** The subjects of a person in these teams: `everyone` first, then a `team:<id>` per team. */
export function subjectsOf(teams: readonly string[]): Subject[] {
  return [EVERYONE, ...[...new Set(teams)].filter(isTeamId).sort().map(teamSubject)];
}
