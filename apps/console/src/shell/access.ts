import type { WorkspaceInfo } from "../workspace";

/**
 * Who may see a route. `everyone` is any signed-in person; `member` a person holding at least one role
 * (an admin included); `admin` a person with the admin role. A person who may not see a route never
 * sees it in a menu: the screen itself still says why when they type the address.
 */
export type Access = "everyone" | "member" | "admin";

export function canSee(access: Access, person: WorkspaceInfo["person"]): boolean {
  if (access === "everyone") return true;
  if (access === "member") return person.admin || person.roles.length > 0;
  return person.admin;
}
