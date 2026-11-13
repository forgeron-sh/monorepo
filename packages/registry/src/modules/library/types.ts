import { PLATFORM, holds } from "@forgeron/permissions";

/**
 * Who may add a tool to their library (D-117). `nobody` until someone who may give access opens it;
 * `teams` and `people` name who. A tool without a rule (deployed before D-117, or created by a first `forgeron deploy`) is
 * open as before: every member reaches it with no install.
 */
export type AvailabilityMode = "nobody" | "everyone" | "teams" | "people";

export interface Availability {
  mode: AvailabilityMode;
  /** For `teams`: the ids of the teams whose members may install it. */
  teams: string[];
  /** For `people`: the members' ids. */
  people: string[];
  updatedBy?: string;
  updatedAt?: string;
}

export const AVAILABILITY_MODES: readonly AvailabilityMode[] = [
  "nobody",
  "everyone",
  "teams",
  "people",
];

/** A person as the rules below read them: who they are, their teams and their platform permissions. */
interface Person {
  id: string;
  teams: readonly string[];
  /** Their platform permissions (`platformPermissionsOf`). */
  permissions: readonly string[];
}

/**
 * Who reaches a channel other than production whatever its rule (D-125, D-129, D-136): a holder of
 * `tools:publish` always; a holder of `tools:read` on a branch's temporary channel only. A permanent
 * channel (`~<name>`) in draft is for those who publish alone: the others use it once it is
 * published to them, like anyone.
 */
export function reachesChannelAlways(
  ref: string,
  person: { permissions: readonly string[] },
): boolean {
  if (holds(PLATFORM, person.permissions, "tools:publish")) return true;
  return !ref.startsWith("~") && holds(PLATFORM, person.permissions, "tools:read");
}

/**
 * May this person use a channel other than production (D-119, D-125, D-129)? Those who always reach
 * it may; anyone else only through the rule set on that channel (its publication).
 */
export function mayUseChannel(
  rule: Availability | undefined,
  person: Person,
  ref: string,
): boolean {
  if (reachesChannelAlways(ref, person)) return true;
  return rule !== undefined && isAvailable(rule, person);
}

/**
 * May this person add the tool to their library? A holder of `access:write` always may (to try a
 * tool before opening it). `undefined`: the tool has no rule, so it is open.
 */
export function isAvailable(availability: Availability | undefined, person: Person): boolean {
  if (!availability) return true;
  if (holds(PLATFORM, person.permissions, "access:write")) return true;
  switch (availability.mode) {
    case "everyone":
      return true;
    case "teams":
      return person.teams.some((t) => availability.teams.includes(t));
    case "people":
      return availability.people.includes(person.id);
    default:
      return false;
  }
}
