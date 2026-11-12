import type { ProfileGrant } from "@forgeron/manifest";

export interface AccessCell {
  /** What the role's mapping (D-127) says for this action. */
  default: boolean;
  /** What an admin set in the console, if anything. */
  override?: boolean;
  /** What applies: the override, else the default. */
  allowed: boolean;
}

/** A profile of the tool as the Access tab shows it. */
interface ProfileInfo {
  label?: string;
  grants: string[];
  /** The profile `member` is mapped to when the tool arrives. */
  default: boolean;
}

/**
 * The Access tab of a tool (D-127): its profiles and permissions, what each workspace role is
 * mapped to, and for each of these roles, for each action, whether it may call it.
 */
export interface AccessMatrix {
  /** The workspace roles with a mapping or an exception: `admin`, `member`, then by name. */
  roles: string[];
  actions: string[];
  /** The views of the tool; their cells are keyed `view:<name>` (D-043). */
  views: string[];
  /** The key of each column in `cells`: the actions, then `view:<name>` for each view. */
  subjects: string[];
  cells: Record<string, Record<string, AccessCell>>;
  /** The permission each subject requires. */
  levels: Record<string, string>;
  /** Every permission of the tool. */
  permissions: string[];
  profiles: Record<string, ProfileInfo>;
  /** What each role of `roles` is given; `none` for a role with exceptions only. */
  mapping: Record<string, ProfileGrant>;
}
