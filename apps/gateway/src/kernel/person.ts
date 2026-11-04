/** The person a tool's runtime sees (`@forgeron/runtime`'s `User`); roles come from the workspace. */
export interface Person {
  id: string;
  email: string;
  name: string;
  roles: string[];
}
