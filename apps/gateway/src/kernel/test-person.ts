import { holds, PLATFORM, PLATFORM_PERMISSIONS, subjectsOf } from "@forgeron/permissions";
import type { PlatformPermission } from "@forgeron/permissions";
import type { Person } from "./person";

/** A person for a test: in these teams, holding what these permissions give (and nothing else). */
export function testPerson(
  permissions: readonly PlatformPermission[] = [],
  teams: string[] = [],
  who: Partial<Pick<Person, "id" | "email" | "name">> = {},
): Person {
  return {
    id: who.id ?? "p-test",
    email: who.email ?? "ada@acme.test",
    name: who.name ?? "Ada",
    teams,
    subjects: subjectsOf(teams),
    permissions: PLATFORM_PERMISSIONS.filter((p) => holds(PLATFORM, permissions, p)),
  };
}
