// The public surface of the templates module: the only file another part of the registry may import.
export { createTemplates } from "./store";
export { templatesMigrations } from "./migrations";
export { TEMPLATE_WORKSPACE } from "./types";
