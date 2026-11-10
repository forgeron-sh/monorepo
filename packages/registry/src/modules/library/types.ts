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
