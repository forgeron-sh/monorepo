// The public surface of the access module: the only file another part of the registry may import.
export { createAccess } from "./store";
export type { AccessCell, AccessMatrix } from "./types";
export { accessMigrations } from "./migrations";
