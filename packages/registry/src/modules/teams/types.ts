import type { Row } from "../../kernel/rows";

/** A group of the workspace's members (D-132): a way to give access, and to see a team's own space. */
export interface Team {
  workspace: string;
  /** Its slug, chosen once: `product`. It is the team's address in tools and in the access matrix. */
  id: string;
  name: string;
  description: string;
  /** The ids of its members. */
  members: string[];
  createdAt: string;
}

/** What a team is called in the access matrix: a role-like subject, so the mapping and the matrix need no second kind (D-132). */
export const teamRole = (id: string) => `team-${id}`;

export const toTeam = (r: Row, members: string[]): Team => ({
  workspace: String(r.workspace),
  id: String(r.id),
  name: String(r.name),
  description: String(r.description ?? ""),
  members,
  createdAt: String(r.created_at),
});
