/**
 * Who may add a tool to their library (D-117). `nobody` until an admin opens it; `roles` and `people`
 * name who. A tool without a rule (deployed before D-117, or created by a first `forgeron deploy`) is
 * open as before: every member reaches it with no install.
 */
export type AvailabilityMode = "nobody" | "everyone" | "roles" | "people";

export interface Availability {
  mode: AvailabilityMode;
  /** For `roles`: the workspace roles that may install it. */
  roles: string[];
  /** For `people`: the members' ids. */
  people: string[];
  updatedBy?: string;
  updatedAt?: string;
}

export const AVAILABILITY_MODES: readonly AvailabilityMode[] = [
  "nobody",
  "everyone",
  "roles",
  "people",
];

/**
 * Who reaches a channel other than production whatever its rule (D-125, D-129): an admin always; a
 * developer on a branch's temporary channel only. A permanent channel (`~<name>`) in draft is for
 * admins alone: a developer uses it once it is published to them, like anyone.
 */
export function reachesChannelAlways(ref: string, person: { roles: readonly string[] }): boolean {
  if (person.roles.includes("admin")) return true;
  return !ref.startsWith("~") && person.roles.includes("developer");
}

/**
 * May this person use a channel other than production (D-119, D-125, D-129)? Those who always reach
 * it may; anyone else only through the rule an admin set on that channel (its publication).
 */
export function mayUseChannel(
  rule: Availability | undefined,
  person: { id: string; roles: readonly string[] },
  ref: string,
): boolean {
  if (reachesChannelAlways(ref, person)) return true;
  return rule !== undefined && isAvailable(rule, person);
}

/**
 * May this person add the tool to their library? An admin always may (to try a tool before opening
 * it). `undefined`: the tool has no rule, so it is open.
 */
export function isAvailable(
  availability: Availability | undefined,
  person: { id: string; roles: readonly string[] },
): boolean {
  if (!availability) return true;
  if (person.roles.includes("admin")) return true;
  switch (availability.mode) {
    case "everyone":
      return true;
    case "roles":
      return person.roles.some((r) => availability.roles.includes(r));
    case "people":
      return availability.people.includes(person.id);
    default:
      return false;
  }
}
