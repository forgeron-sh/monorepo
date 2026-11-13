import type { PlatformPermission } from "@forgeron/permissions";
import type { Row } from "../../kernel/rows";

/** A group of the workspace's members (D-132): a way to give access, and to say what a person may do on the platform (D-137). */
export interface Team {
  workspace: string;
  /** Its slug, chosen once: `product`. It is the team's address in tools and in the access matrix. */
  id: string;
  name: string;
  description: string;
  /** The ids of its members. */
  members: string[];
  /** Created with every workspace (`admin`, `developer`): it cannot be deleted. */
  builtIn: boolean;
  /** Its permissions cannot be changed: `admin` always holds every one. */
  locked: boolean;
  /** What it was given on the platform, as stored: the fewest grants, `*` for every one. */
  permissions: string[];
  /** Every platform permission it gives, the implied ones included. */
  effective: PlatformPermission[];
  createdAt: string;
}

/** The row of a team, with its members and the grants stored for it. */
export const toTeam = (
  r: Row,
  members: string[],
  permissions: string[],
  locked: boolean,
  effective: PlatformPermission[],
): Team => ({
  workspace: String(r.workspace),
  id: String(r.id),
  name: String(r.name),
  description: String(r.description ?? ""),
  members,
  builtIn: Number(r.built_in ?? 0) === 1,
  locked,
  permissions,
  effective,
  createdAt: String(r.created_at),
});
