// The public surface of the catalog module: the only file another part of the registry may import.
export { channelNameProblem, createCatalog } from "./store";
export type { Catalog } from "./store";
export type {
  Tool,
  BuildRecord,
  VersionRecord,
  EnvironmentRecord,
  DeploymentKind,
  DeploymentCommit,
  DeploymentRecord,
  DocFile,
} from "./types";
export { catalogMigrations } from "./migrations";
