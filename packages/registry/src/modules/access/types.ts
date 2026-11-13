import type { ProfileGrant } from "@forgeron/manifest";

export interface AccessCell {
  /** What the subject's grant (D-127) says for this action. */
  default: boolean;
  /** What someone who gives access set in the console, if anything. */
  override?: boolean;
  /** What applies: the override, else the default. */
  allowed: boolean;
}

/** A profile of the tool as the Access tab shows it. */
interface ProfileInfo {
  label?: string;
  grants: string[];
  /** The profile `everyone` is given when the tool arrives. */
  default: boolean;
}

/**
 * The Access tab of a tool (D-127, D-136): its profiles and permissions, what each subject (everyone
 * and the teams) is given, and for each of them, for each action, whether it may call it.
 */
export interface AccessMatrix {
  /** `everyone`, then the workspace's teams by name (`team:<id>`), then any other subject that has a grant. */
  subjects: string[];
  /** What to show for each subject: "Everyone", a team's name, the id of a team that is gone. */
  subjectLabels: Record<string, string>;
  actions: string[];
  /** The views of the tool; their cells are keyed `view:<name>` (D-043). */
  views: string[];
  /** The key of each column in `cells`: the actions, then `view:<name>` for each view. */
  columns: string[];
  cells: Record<string, Record<string, AccessCell>>;
  /** The permission each column requires. */
  levels: Record<string, string>;
  /** Every permission of the tool. */
  permissions: string[];
  profiles: Record<string, ProfileInfo>;
  /** What each subject of `subjects` is given; `none` for a subject with nothing. */
  grants: Record<string, ProfileGrant>;
}
