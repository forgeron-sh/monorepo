// The registry of the platform D1 (docs/ARCHITECTURE.md, "The platform"). Neutral: usable from the
// gateway (a Worker) and from a script.
import { applyMigrations, type D1Database, type MigrateOptions } from "@forgeron/hosting";
import { platformMigrations } from "./migrations";

export { platformMigrations } from "./migrations";
export {
  approveVersion,
  closeChannel,
  closePreview,
  deployBuild,
  isReleaseVersion,
  putOnChannel,
  rejectVersion,
  rollbackEnvironment,
} from "./deploy";
export type { DeployBuildInput, DeployedBuild, PutOnChannelInput, RollbackInput } from "./deploy";
export {
  AVAILABILITY_MODES,
  channelNameProblem,
  createRegistry,
  isAvailable,
  marketplaceSource,
  mayUseChannel,
  reachesChannelAlways,
  RegistryError,
  secretEnvironmentOf,
  TEMPLATE_WORKSPACE,
  VIA_FORGERON_MCP,
} from "./registry";
export type {
  Availability,
  AvailabilityMode,
  AvailableUpdate,
  GithubApp,
  GithubAppKeys,
  GithubInstallation,
  Marketplace,
  PermanentChannel,
  ToolSource,
} from "./registry";
export { docsProblem } from "./docs-check";
export { listCatalog, findCard, findAsset, assetUrl } from "./catalog";
export type { CatalogCaller } from "./catalog";
export { ConsentError, createConsent } from "./consent";
export type {
  Consent,
  ConsentErrorCode,
  ConsentFetch,
  ConsentOptions,
  ConsentTarget,
  OAuthProvider,
} from "./consent";
export { createIdentityConfig } from "./identity-config";
export { planUpdate, updatePrompt } from "./update-plan";
export type {
  PlanChange,
  PlanConflict,
  PlanConflictCode,
  PlanInput,
  UpdatePlan,
} from "./update-plan";
export {
  channelRef,
  environmentOfRef,
  hostingTargetOf,
  hostingTargetOfRef,
  isPermanentRef,
  parseChannelRef,
  PERMANENT_MARK,
} from "./channels";
export { createReseal, type ResealReport } from "./reseal";
export type {
  ConnectorClientConfig,
  ConnectorClientInput,
  IdentityConfig,
  IdentityProviderConfig,
  IdentityProviderInput,
  IdentityProviderKind,
  SamlProviderConfig,
  SamlProviderInput,
} from "./identity-config";
export { createSamlRequests } from "./saml-requests";
export { createEmailCodes, type EmailCodes } from "./email-codes";
export { loadGatewayAssets, saveGatewayAssets } from "./gateway-assets";
export { loadGatewayCode, saveGatewayCode } from "./gateway-code";
export { createSecretBox, type SealedSecret, type SecretBox } from "./secret-box";
export type {
  AccessCell,
  AccessMatrix,
  Approval,
  AuditEntry,
  AuditInterface,
  AuditKind,
  AuditRecord,
  AuditResult,
  ApprovalStatus,
  BuildRecord,
  ConnectionInfo,
  ConnectionTokens,
  DeploymentCommit,
  DeploymentKind,
  DeploymentRecord,
  EnvironmentRecord,
  Invitation,
  JoinVia,
  Member,
  MembershipSettings,
  Registry,
  RegistryErrorCode,
  RegistryOptions,
  SecretRequestInfo,
  SecretRequestRefusal,
  SecretState,
  SecretStatus,
  RegisteredEnvironment,
  SecretEnvironment,
  Team,
  Tool,
  VersionRecord,
} from "./registry";

/** Brings the platform D1 up to the current schema: the pending migrations, one batch each. */
export function migratePlatform(d1: D1Database, options?: MigrateOptions) {
  return applyMigrations(d1, platformMigrations, options);
}
