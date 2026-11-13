// The public surface of the platform-updates module: the only file another part of the registry may import.
export { createPlatformUpdates } from "./store";
export { platformUpdatesMigrations } from "./migrations";
export { UPDATE_STEPS } from "./types";
export type {
  UpdateRun,
  UpdateRunState,
  UpdateStep,
  UpdateStepName,
  UpdateStepState,
} from "./types";
