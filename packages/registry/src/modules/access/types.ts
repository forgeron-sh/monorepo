export interface AccessCell {
  /** What the role's levels say for this action. */
  default: boolean;
  /** What an admin set in the console, if anything. */
  override?: boolean;
  /** What applies: the override, else the default. */
  allowed: boolean;
}

/** The matrix of a tool: for each role, for each action, whether it may call it. */
export interface AccessMatrix {
  roles: string[];
  actions: string[];
  /** The views of the tool; their cells are keyed `view:<name>` (D-043). */
  views: string[];
  /** The key of each column in `cells`: the actions, then `view:<name>` for each view. */
  subjects: string[];
  cells: Record<string, Record<string, AccessCell>>;
}
