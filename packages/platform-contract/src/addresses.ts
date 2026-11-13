import type { getAccessMatrixRoute, putAccessMatrixRoute } from "./access-matrix";
import type { decideApprovalRoute, listApprovalsRoute } from "./approvals";
import type { catalogAssetRoute, listCatalogRoute, toolCardRoute } from "./catalog";
import type { listConnectionsRoute, revokeConnectionRoute } from "./connections";
import type {
  dbEnvironmentsRoute,
  dbExportRoute,
  dbRowsRoute,
  dbSchemaRoute,
  dbTableRoute,
  dbTablesRoute,
} from "./database";
import type { createTeamRoute, deleteTeamRoute, listTeamsRoute, updateTeamRoute } from "./teams";
import type {
  deleteConnectorClientRoute,
  deleteIdentityProviderRoute,
  getIdentityProviderRoute,
  listConnectorClientsRoute,
  putConnectorClientRoute,
  putIdentityProviderRoute,
} from "./identity";
import type {
  getAvailabilityRoute,
  getPilotAvailabilityRoute,
  installLibraryToolRoute,
  installPilotRoute,
  pilotCardRoute,
  putPilotAvailabilityRoute,
  uninstallPilotRoute,
  libraryCardRoute,
  listLibraryRoute,
  putAvailabilityRoute,
  uninstallLibraryToolRoute,
} from "./library";
import type {
  addRepositoryToolRoute,
  addChannelRoute,
  copyBranchDataRoute,
  getToolSourceRoute,
  putChannelRoute,
  removeChannelRoute,
  putToolSourceRoute,
  updateToolRoute,
} from "./sources";
import type {
  addMarketplaceRoute,
  installMarketplaceToolRoute,
  listMarketplacesRoute,
  listMarketplaceToolsRoute,
  marketplaceToolCardRoute,
  planMarketplaceToolRoute,
  removeMarketplaceRoute,
  syncMarketplaceRoute,
} from "./marketplaces";
import type {
  getMembershipSettingsRoute,
  inviteMemberRoute,
  listMembersRoute,
  putMembershipSettingsRoute,
  removeMemberRoute,
  setMemberRolesRoute,
  withdrawInvitationRoute,
} from "./members";
import type {
  clearUserSetupRoute,
  clearUserSetupValueRoute,
  listUserSecretHoldersRoute,
  listUserSetupRoute,
  revokePersonTokensRoute,
  revokeUserSecretRoute,
  revokeUserSecretsRoute,
  setUserSecretRoute,
} from "./revocations";
import type {
  createSecretRequestRoute,
  fulfilSecretRequestRoute,
  lookupSecretRequestRoute,
} from "./secret-requests";
import type { listSecretsRoute, setSecretRoute } from "./secrets";
import type {
  createInstallPlanRoute,
  installFromPlanRoute,
  installTemplateRoute,
  listTemplatesRoute,
} from "./templates";
import type { dbMigrationsRoute, dbQueryRoute } from "./database-admin";
import type {
  createGithubToolRoute,
  disconnectGithubRoute,
  getGithubRoute,
  linkGithubRepositoryRoute,
  listGithubRepositoriesRoute,
} from "./github";
import type { resealSecretsRoute, secretsStatusRoute } from "./secrets-status";
import type {
  listToolsRoute,
  toolActivityRoute,
  toolBranchesRoute,
  toolManifestRoute,
  toolVersionsRoute,
} from "./tools";
import type {
  cliTokenRoute,
  closePreviewRoute,
  createDeployTokenRoute,
  deployRoute,
  issueTokenRoute,
  revokeTokenRoute,
  rollbackRoute,
  whoamiRoute,
} from "./bearer";
import type {
  consentCallbackRoute,
  listConsentsRoute,
  startConsentRoute,
  withdrawConsentRoute,
} from "./consent";
import type { auditRoute, usageRoute, workspaceRoute } from "./workspace";
import { addressOf } from "./route";

// The address of every route of the platform API (method and path), typed from the route: a client
// holds these and imports no schema. An address that is not the route's method and path does not
// compile, so this table cannot drift from the contract. A new route is added here with its object.
export const addresses = {
  audit: addressOf<typeof auditRoute>({ method: "get", path: "/api/audit" }),
  catalogAsset: addressOf<typeof catalogAssetRoute>({
    method: "get",
    path: "/api/catalog/{tool}/assets/{path}",
  }),
  dbMigrations: addressOf<typeof dbMigrationsRoute>({
    method: "get",
    path: "/api/tools/{tool}/db/migrations",
  }),
  dbQuery: addressOf<typeof dbQueryRoute>({
    method: "post",
    path: "/api/tools/{tool}/db/query",
  }),
  dbEnvironments: addressOf<typeof dbEnvironmentsRoute>({
    method: "get",
    path: "/api/tools/{tool}/db/environments",
  }),
  dbExport: addressOf<typeof dbExportRoute>({
    method: "get",
    path: "/api/tools/{tool}/db/tables/{table}/export",
  }),
  dbRows: addressOf<typeof dbRowsRoute>({
    method: "get",
    path: "/api/tools/{tool}/db/tables/{table}/rows",
  }),
  dbSchema: addressOf<typeof dbSchemaRoute>({ method: "get", path: "/api/tools/{tool}/db/schema" }),
  dbTable: addressOf<typeof dbTableRoute>({
    method: "get",
    path: "/api/tools/{tool}/db/tables/{table}",
  }),
  dbTables: addressOf<typeof dbTablesRoute>({ method: "get", path: "/api/tools/{tool}/db/tables" }),
  decideApproval: addressOf<typeof decideApprovalRoute>({
    method: "post",
    path: "/api/approvals/{id}",
  }),
  createSecretRequest: addressOf<typeof createSecretRequestRoute>({
    method: "post",
    path: "/api/tools/{tool}/environments/{environment}/secrets/{name}/request",
  }),
  deleteConnectorClient: addressOf<typeof deleteConnectorClientRoute>({
    method: "delete",
    path: "/api/connector-clients/{type}",
  }),
  deleteIdentityProvider: addressOf<typeof deleteIdentityProviderRoute>({
    method: "delete",
    path: "/api/identity-provider",
  }),
  fulfilSecretRequest: addressOf<typeof fulfilSecretRequestRoute>({
    method: "post",
    path: "/api/secret-requests/fulfil",
  }),
  getAccessMatrix: addressOf<typeof getAccessMatrixRoute>({
    method: "get",
    path: "/api/tools/{tool}/access-matrix",
  }),
  getIdentityProvider: addressOf<typeof getIdentityProviderRoute>({
    method: "get",
    path: "/api/identity-provider",
  }),
  getMembershipSettings: addressOf<typeof getMembershipSettingsRoute>({
    method: "get",
    path: "/api/membership-settings",
  }),
  createInstallPlan: addressOf<typeof createInstallPlanRoute>({
    method: "post",
    path: "/api/templates/{name}/install-plan",
  }),
  installFromPlan: addressOf<typeof installFromPlanRoute>({
    method: "post",
    path: "/api/install-plans/{plan}/install",
  }),
  installTemplate: addressOf<typeof installTemplateRoute>({
    method: "post",
    path: "/api/templates/{name}/install",
  }),
  inviteMember: addressOf<typeof inviteMemberRoute>({ method: "post", path: "/api/invitations" }),
  listLibrary: addressOf<typeof listLibraryRoute>({ method: "get", path: "/api/library" }),
  libraryCard: addressOf<typeof libraryCardRoute>({ method: "get", path: "/api/library/{tool}" }),
  installLibraryTool: addressOf<typeof installLibraryToolRoute>({
    method: "post",
    path: "/api/library/{tool}",
  }),
  uninstallLibraryTool: addressOf<typeof uninstallLibraryToolRoute>({
    method: "delete",
    path: "/api/library/{tool}",
  }),
  getToolSource: addressOf<typeof getToolSourceRoute>({
    method: "get",
    path: "/api/tools/{tool}/source",
  }),
  putToolSource: addressOf<typeof putToolSourceRoute>({
    method: "put",
    path: "/api/tools/{tool}/source",
  }),
  updateTool: addressOf<typeof updateToolRoute>({
    method: "post",
    path: "/api/tools/{tool}/update",
  }),
  addChannel: addressOf<typeof addChannelRoute>({
    method: "post",
    path: "/api/tools/{tool}/channels",
  }),
  putChannel: addressOf<typeof putChannelRoute>({
    method: "put",
    path: "/api/tools/{tool}/channels/{channel}",
  }),
  removeChannel: addressOf<typeof removeChannelRoute>({
    method: "delete",
    path: "/api/tools/{tool}/channels/{channel}",
  }),
  addRepositoryTool: addressOf<typeof addRepositoryToolRoute>({
    method: "post",
    path: "/api/tools/from-repository",
  }),
  copyBranchData: addressOf<typeof copyBranchDataRoute>({
    method: "post",
    path: "/api/tools/{tool}/branches/{branch}/data",
  }),
  getAvailability: addressOf<typeof getAvailabilityRoute>({
    method: "get",
    path: "/api/tools/{tool}/availability",
  }),
  putAvailability: addressOf<typeof putAvailabilityRoute>({
    method: "put",
    path: "/api/tools/{tool}/availability",
  }),
  pilotCard: addressOf<typeof pilotCardRoute>({
    method: "get",
    path: "/api/library/{tool}/pilots/{branch}",
  }),
  installPilot: addressOf<typeof installPilotRoute>({
    method: "post",
    path: "/api/library/{tool}/pilots/{branch}",
  }),
  uninstallPilot: addressOf<typeof uninstallPilotRoute>({
    method: "delete",
    path: "/api/library/{tool}/pilots/{branch}",
  }),
  getPilotAvailability: addressOf<typeof getPilotAvailabilityRoute>({
    method: "get",
    path: "/api/tools/{tool}/previews/{branch}/availability",
  }),
  putPilotAvailability: addressOf<typeof putPilotAvailabilityRoute>({
    method: "put",
    path: "/api/tools/{tool}/previews/{branch}/availability",
  }),
  listMarketplaces: addressOf<typeof listMarketplacesRoute>({
    method: "get",
    path: "/api/marketplaces",
  }),
  addMarketplace: addressOf<typeof addMarketplaceRoute>({
    method: "post",
    path: "/api/marketplaces",
  }),
  removeMarketplace: addressOf<typeof removeMarketplaceRoute>({
    method: "delete",
    path: "/api/marketplaces/{id}",
  }),
  syncMarketplace: addressOf<typeof syncMarketplaceRoute>({
    method: "post",
    path: "/api/marketplaces/{id}/sync",
  }),
  listMarketplaceTools: addressOf<typeof listMarketplaceToolsRoute>({
    method: "get",
    path: "/api/marketplaces/{id}/tools",
  }),
  marketplaceToolCard: addressOf<typeof marketplaceToolCardRoute>({
    method: "get",
    path: "/api/marketplaces/{id}/tools/{tool}",
  }),
  installMarketplaceTool: addressOf<typeof installMarketplaceToolRoute>({
    method: "post",
    path: "/api/marketplaces/{id}/tools/{tool}/install",
  }),
  planMarketplaceTool: addressOf<typeof planMarketplaceToolRoute>({
    method: "post",
    path: "/api/marketplaces/{id}/tools/{tool}/install-plan",
  }),
  listApprovals: addressOf<typeof listApprovalsRoute>({ method: "get", path: "/api/approvals" }),
  listCatalog: addressOf<typeof listCatalogRoute>({ method: "get", path: "/api/catalog" }),
  listConnections: addressOf<typeof listConnectionsRoute>({
    method: "get",
    path: "/api/tools/{tool}/environments/{environment}/connections",
  }),
  listConnectorClients: addressOf<typeof listConnectorClientsRoute>({
    method: "get",
    path: "/api/connector-clients",
  }),
  listMembers: addressOf<typeof listMembersRoute>({ method: "get", path: "/api/members" }),
  listTeams: addressOf<typeof listTeamsRoute>({ method: "get", path: "/api/teams" }),
  createTeam: addressOf<typeof createTeamRoute>({ method: "post", path: "/api/teams" }),
  updateTeam: addressOf<typeof updateTeamRoute>({ method: "patch", path: "/api/teams/{id}" }),
  deleteTeam: addressOf<typeof deleteTeamRoute>({ method: "delete", path: "/api/teams/{id}" }),
  listSecrets: addressOf<typeof listSecretsRoute>({
    method: "get",
    path: "/api/tools/{tool}/environments/{environment}/secrets",
  }),
  listTemplates: addressOf<typeof listTemplatesRoute>({ method: "get", path: "/api/templates" }),
  listTools: addressOf<typeof listToolsRoute>({ method: "get", path: "/api/tools" }),
  clearUserSetup: addressOf<typeof clearUserSetupRoute>({
    method: "delete",
    path: "/api/tools/{tool}/user-setup/{person}",
  }),
  clearUserSetupValue: addressOf<typeof clearUserSetupValueRoute>({
    method: "delete",
    path: "/api/tools/{tool}/user-setup/{person}/{name}",
  }),
  listUserSetup: addressOf<typeof listUserSetupRoute>({
    method: "get",
    path: "/api/tools/{tool}/user-setup",
  }),
  listUserSecretHolders: addressOf<typeof listUserSecretHoldersRoute>({
    method: "get",
    path: "/api/tools/{tool}/user-secrets",
  }),
  lookupSecretRequest: addressOf<typeof lookupSecretRequestRoute>({
    method: "post",
    path: "/api/secret-requests/lookup",
  }),
  putAccessMatrix: addressOf<typeof putAccessMatrixRoute>({
    method: "put",
    path: "/api/tools/{tool}/access-matrix",
  }),
  putConnectorClient: addressOf<typeof putConnectorClientRoute>({
    method: "put",
    path: "/api/connector-clients/{type}",
  }),
  putIdentityProvider: addressOf<typeof putIdentityProviderRoute>({
    method: "put",
    path: "/api/identity-provider",
  }),
  putMembershipSettings: addressOf<typeof putMembershipSettingsRoute>({
    method: "put",
    path: "/api/membership-settings",
  }),
  removeMember: addressOf<typeof removeMemberRoute>({
    method: "delete",
    path: "/api/members/{id}",
  }),
  revokeConnection: addressOf<typeof revokeConnectionRoute>({
    method: "delete",
    path: "/api/tools/{tool}/environments/{environment}/connections/{user}/{connector}",
  }),
  revokePersonTokens: addressOf<typeof revokePersonTokensRoute>({
    method: "post",
    path: "/api/people/{id}/tokens/revoke",
  }),
  revokeUserSecret: addressOf<typeof revokeUserSecretRoute>({
    method: "delete",
    path: "/api/tools/{tool}/user-secrets/{person}/{name}",
  }),
  revokeUserSecrets: addressOf<typeof revokeUserSecretsRoute>({
    method: "delete",
    path: "/api/tools/{tool}/user-secrets/{person}",
  }),
  setUserSecret: addressOf<typeof setUserSecretRoute>({
    method: "put",
    path: "/api/tools/{tool}/user-secrets/{person}/{name}",
  }),
  resealSecrets: addressOf<typeof resealSecretsRoute>({
    method: "post",
    path: "/api/secrets/reseal",
  }),
  secretsStatus: addressOf<typeof secretsStatusRoute>({
    method: "get",
    path: "/api/tools/{tool}/secrets-status",
  }),
  setMemberRoles: addressOf<typeof setMemberRolesRoute>({
    method: "patch",
    path: "/api/members/{id}",
  }),
  setSecret: addressOf<typeof setSecretRoute>({
    method: "put",
    path: "/api/tools/{tool}/environments/{environment}/secrets/{name}",
  }),
  toolActivity: addressOf<typeof toolActivityRoute>({
    method: "get",
    path: "/api/tools/{tool}/activity",
  }),
  toolBranches: addressOf<typeof toolBranchesRoute>({
    method: "get",
    path: "/api/tools/{tool}/branches",
  }),
  toolCard: addressOf<typeof toolCardRoute>({ method: "get", path: "/api/catalog/{tool}" }),
  toolManifest: addressOf<typeof toolManifestRoute>({
    method: "get",
    path: "/api/tools/{tool}/manifest",
  }),
  toolVersions: addressOf<typeof toolVersionsRoute>({
    method: "get",
    path: "/api/tools/{tool}/versions",
  }),
  withdrawInvitation: addressOf<typeof withdrawInvitationRoute>({
    method: "delete",
    path: "/api/invitations/{email}",
  }),
  usage: addressOf<typeof usageRoute>({ method: "get", path: "/api/usage" }),
  workspace: addressOf<typeof workspaceRoute>({ method: "get", path: "/api/workspace" }),
  cliToken: addressOf<typeof cliTokenRoute>({ method: "post", path: "/auth/cli/token" }),
  closePreview: addressOf<typeof closePreviewRoute>({ method: "delete", path: "/deploy" }),
  createDeployToken: addressOf<typeof createDeployTokenRoute>({
    method: "post",
    path: "/deploy-tokens",
  }),
  deploy: addressOf<typeof deployRoute>({ method: "post", path: "/deploy" }),
  issueToken: addressOf<typeof issueTokenRoute>({ method: "post", path: "/auth/token" }),
  revokeToken: addressOf<typeof revokeTokenRoute>({ method: "post", path: "/auth/token/revoke" }),
  rollback: addressOf<typeof rollbackRoute>({ method: "post", path: "/rollback" }),
  whoami: addressOf<typeof whoamiRoute>({ method: "get", path: "/whoami" }),
  consentCallback: addressOf<typeof consentCallbackRoute>({
    method: "get",
    path: "/api/consent/callback",
  }),
  listConsents: addressOf<typeof listConsentsRoute>({
    method: "get",
    path: "/api/tools/{tool}/environments/{environment}/consent",
  }),
  startConsent: addressOf<typeof startConsentRoute>({
    method: "get",
    path: "/api/tools/{tool}/environments/{environment}/consent/{name}",
  }),
  withdrawConsent: addressOf<typeof withdrawConsentRoute>({
    method: "delete",
    path: "/api/tools/{tool}/environments/{environment}/consent/{name}",
  }),
  getGithub: addressOf<typeof getGithubRoute>({ method: "get", path: "/api/github" }),
  disconnectGithub: addressOf<typeof disconnectGithubRoute>({
    method: "delete",
    path: "/api/github",
  }),
  listGithubRepositories: addressOf<typeof listGithubRepositoriesRoute>({
    method: "get",
    path: "/api/github/repositories",
  }),
  linkGithubRepository: addressOf<typeof linkGithubRepositoryRoute>({
    method: "post",
    path: "/api/github/repositories/link",
  }),
  createGithubTool: addressOf<typeof createGithubToolRoute>({
    method: "post",
    path: "/api/github/tools",
  }),
};
