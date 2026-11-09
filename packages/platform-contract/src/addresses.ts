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
import type {
  deleteConnectorClientRoute,
  deleteIdentityProviderRoute,
  getIdentityProviderRoute,
  listConnectorClientsRoute,
  putConnectorClientRoute,
  putIdentityProviderRoute,
} from "./identity";
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
import type { secretsStatusRoute } from "./secrets-status";
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
  promoteRoute,
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
  promote: addressOf<typeof promoteRoute>({ method: "post", path: "/promote" }),
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
};
