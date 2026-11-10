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
import { createIdentityStore } from "./modules/identity-store/public";
import { createLibrary } from "./modules/library/public";
import { createMarketplaces } from "./modules/marketplaces/public";
import { createMembers } from "./modules/members/public";
import { createSecrets } from "./modules/secrets/public";
import { createTemplates } from "./modules/templates/public";
import { createUsage } from "./modules/usage/public";

export { RegistryError } from "./kernel/errors";
export type { RegisteredEnvironment, RegistryErrorCode } from "./kernel/errors";
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
export type {
  SecretRequestInfo,
  SecretRequestRefusal,
  SecretState,
  SecretStatus,
} from "./modules/secrets/public";
export { TEMPLATE_WORKSPACE } from "./modules/templates/public";
export type { AvailableUpdate, ToolSource } from "./modules/templates/public";
export { marketplaceSource } from "./modules/marketplaces/public";
export { AVAILABILITY_MODES, isAvailable, mayPilot } from "./modules/library/public";
export type { Availability, AvailabilityMode } from "./modules/library/public";
export type { Marketplace } from "./modules/marketplaces/public";

export function createRegistry(d1: D1Database, options: RegistryOptions = {}) {
  const kernel = createKernel(d1, options);
  const catalog = createCatalog(kernel);
  // What the other modules ask of the catalog: `requireTool` and its methods, by name.
  const catalogPort = { requireTool: catalog.requireTool, ...catalog.api };
  return {
    ...catalog.api,
    ...createSecrets(kernel, catalogPort),
    ...createConnections(kernel, catalogPort),
    ...createMembers(kernel),
    ...createIdentityStore(kernel),
    ...createApprovals(kernel, catalogPort),
    ...createAudit(kernel),
    ...createAccess(kernel, catalogPort),
    ...createTemplates(kernel, catalogPort),
    ...createMarketplaces(kernel, catalogPort),
    ...createLibrary(kernel),
    ...createUsage(kernel),
  };
}

export type Registry = ReturnType<typeof createRegistry>;
