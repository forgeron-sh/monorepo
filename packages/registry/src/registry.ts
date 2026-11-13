// The typed access layer over the platform D1. Plain SQL on the small D1 surface that `hosting`
// already defines, so the gateway, a script and a test all use it. Every write is one statement or
// one batch (D-012). The code lives in `modules/<domain>/`; this file composes the modules behind
// the single `createRegistry` the rest of the platform has always called.
import type { D1Database } from "@forgeron/hosting";
import { createKernel, type RegistryOptions } from "./kernel/kernel";
import { createAccess } from "./modules/access/public";
import { createApprovals } from "./modules/approvals/public";
import { createAudit } from "./modules/audit/public";
import { createCatalog } from "./modules/catalog/public";
import { createConnections } from "./modules/connections/public";
import { createGithub } from "./modules/github/public";
import { createIdentityStore } from "./modules/identity-store/public";
import { createLibrary } from "./modules/library/public";
import { createMarketplaces } from "./modules/marketplaces/public";
import { createMembers } from "./modules/members/public";
import { createPlatformUpdates } from "./modules/platform-updates/public";
import { createTeams } from "./modules/teams/public";
import { createSecrets } from "./modules/secrets/public";
import { createTemplates } from "./modules/templates/public";
import { createUsage } from "./modules/usage/public";

export { RegistryError, secretEnvironmentOf } from "./kernel/errors";
export type { RegisteredEnvironment, RegistryErrorCode, SecretEnvironment } from "./kernel/errors";
export type { AuditEntry, AuditInterface, AuditKind, AuditResult } from "./kernel/audit";
export type { RegistryOptions } from "./kernel/kernel";
export type { AccessCell, AccessMatrix } from "./modules/access/public";
export type { Approval, ApprovalStatus } from "./modules/approvals/public";
export { VIA_FORGERON_MCP } from "./modules/audit/public";
export type { AuditRecord } from "./modules/audit/public";
export type {
  BuildRecord,
  DeploymentCommit,
  DeploymentKind,
  DeploymentRecord,
  DocFile,
  EnvironmentRecord,
  Tool,
  VersionRecord,
} from "./modules/catalog/public";
export type { ConnectionInfo, ConnectionTokens } from "./modules/connections/public";
export type { Invitation, JoinVia, Member, MembershipSettings } from "./modules/members/public";
export type { Team } from "./modules/teams/public";
export type {
  SecretRequestInfo,
  SecretRequestRefusal,
  SecretState,
  SecretStatus,
} from "./modules/secrets/public";
export { TEMPLATE_WORKSPACE } from "./modules/templates/public";
export type { AvailableUpdate, PermanentChannel, ToolSource } from "./modules/templates/public";
export { channelNameProblem } from "./modules/catalog/public";
export { marketplaceSource } from "./modules/marketplaces/public";
export {
  AVAILABILITY_MODES,
  isAvailable,
  mayUseChannel,
  reachesChannelAlways,
} from "./modules/library/public";
export type { Availability, AvailabilityMode } from "./modules/library/public";
export type { Marketplace } from "./modules/marketplaces/public";
export type { GithubApp, GithubAppKeys, GithubInstallation } from "./modules/github/public";
export { UPDATE_STEPS } from "./modules/platform-updates/public";
export type {
  UpdateRun,
  UpdateRunState,
  UpdateStep,
  UpdateStepName,
  UpdateStepState,
} from "./modules/platform-updates/public";

export function createRegistry(d1: D1Database, options: RegistryOptions = {}) {
  const kernel = createKernel(d1, options);
  const catalog = createCatalog(kernel);
  // What the other modules ask of the catalog: `requireTool` and its methods, by name.
  const catalogPort = { requireTool: catalog.requireTool, ...catalog.api };
  const teams = createTeams(kernel);
  return {
    ...catalog.api,
    ...createSecrets(kernel, catalogPort),
    ...createConnections(kernel, catalogPort),
    ...createMembers(kernel, teams),
    ...teams,
    ...createIdentityStore(kernel),
    ...createApprovals(kernel, catalogPort),
    ...createAudit(kernel),
    ...createAccess(kernel, catalogPort),
    ...createTemplates(kernel, catalogPort),
    ...createMarketplaces(kernel, catalogPort),
    ...createLibrary(kernel),
    ...createUsage(kernel),
    ...createGithub(kernel),
    ...createPlatformUpdates(kernel),
    /**
     * The registry's generation (D-146): raised after a change, so that a memory of reads is checked with
     * one small read. `0` on a database that has no generation yet.
     */
    async readRegistryGeneration(): Promise<number> {
      const row = await kernel.first(`SELECT "n" FROM "registry_generation" WHERE "id" = 1`);
      return Number(row?.n ?? 0);
    },
    /** Raises the registry's generation: every memory of reads made before it is out of date. */
    async bumpRegistryGeneration(): Promise<void> {
      await kernel.write(`UPDATE "registry_generation" SET "n" = "n" + 1 WHERE "id" = 1`);
    },
  };
}

export type Registry = ReturnType<typeof createRegistry>;
