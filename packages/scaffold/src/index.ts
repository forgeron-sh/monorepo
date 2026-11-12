// What a new tool or marketplace is made of (D-121, D-123), as pure functions: `forgeron init` writes
// these files on disk, the gateway commits them into a repository it creates for a workspace. Neutral:
// no Node module, it runs in the gateway's Worker.
export { CLAUDE_MD, marketplaceAgents, toolAgents } from "./agents";
export { LIFECYCLE, LIFECYCLE_PATH } from "./lifecycle";
export { MARKETPLACE_INDEX_PATH, marketplaceFiles } from "./marketplace";
export { PROJECT_PATH, projectFile, repositoryFiles, toolFiles, VITEST_VERSION } from "./tool";
export { deployAction, workflow, WORKFLOW_PATH } from "./workflow";
