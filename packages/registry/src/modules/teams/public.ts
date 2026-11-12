// The public surface of the teams module: the only file another part of the registry may import.
export { createTeams } from "./store";
export { teamRole } from "./types";
export type { Team } from "./types";
export { teamsMigrations } from "./migrations";
