import type { WorkspaceInfo } from "../workspace";

/**
 * Who may see a route. `everyone` is any signed-in person; `member` a person holding at least one role
 * (an admin included); `developer` an admin or a person with the developer role (the technical screens,
 * D-118); `admin` a person with the admin role. A person who may not see a route never
 * sees it in a menu: the screen itself still says why when they type the address.
 */
export type Access = "everyone" | "member" | "developer" | "admin";

export function canSee(access: Access, person: WorkspaceInfo["person"]): boolean {
  if (access === "everyone") return true;
  if (access === "member") return person.admin || person.roles.length > 0;
  if (access === "developer") return person.admin || person.roles.includes("developer");
  return person.admin;
}
