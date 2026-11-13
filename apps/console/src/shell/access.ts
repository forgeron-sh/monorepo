import { holds, PLATFORM, type PlatformPermission } from "@forgeron/permissions";
import type { WorkspaceInfo } from "../workspace";

/**
 * Who may see a route (D-136): `signed-in` is any person; otherwise a platform permission the person
 * holds through their teams. A person who may not see a route never sees it in a menu: the screen
 * itself still says why when they type the address.
 */
export type Access = "signed-in" | PlatformPermission;

type Person = WorkspaceInfo["person"];

/** Whether the person holds the permission: the one place the console asks (D-136). */
export const can = (person: Pick<Person, "permissions">, permission: PlatformPermission): boolean =>
  holds(PLATFORM, person.permissions, permission);

export const canSee = (access: Access, person: Pick<Person, "permissions">): boolean =>
  access === "signed-in" || can(person, access);

/** What a permission is called to a person: "Manage members". */
export const permissionLabel = (permission: PlatformPermission): string =>
  PLATFORM.permissions[permission].label;

/** The sentence that tells a person what to ask for, and whom: a permission. */
export const askFor = (permission: PlatformPermission): string =>
  `Ask someone who manages teams for "${permissionLabel(permission)}".`;
