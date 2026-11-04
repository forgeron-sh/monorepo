import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The sign-in configuration of a workspace, edited by an admin in the console (D-041, D-050): the
// provider (OIDC: Entra ID, Google or any; or SAML) and the OAuth clients of the delegated connectors.
// A client secret goes in and never comes out: the answers say only whether one is kept.
//
// The bodies of the two `PUT`s are checked by the parsers of the identity module (`parseIdentityProviderInput`,
// `parseSamlProviderInput`, the connector client's own rules): they answer with a message that names the
// field, which the console shows as it is. The contract therefore takes the body as any JSON and says
// what it holds in the description.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");
const noSecretKey = json(ErrorSchema, "The gateway has no secret key (`NOT_CONFIGURED`)");

const provider = z.looseObject({ kind: z.string() });

export const getIdentityProviderRoute = defineRoute({
  method: "get",
  path: "/api/identity-provider",
  summary: "The workspace's sign-in provider, or null",
  tags: ["identity"],
  responses: {
    200: json(z.strictObject({ provider: provider.nullable() }), "The provider"),
    401: notSignedIn,
    403: notAdmin,
  },
});

export const putIdentityProviderRoute = defineRoute({
  method: "put",
  path: "/api/identity-provider",
  summary: "Set the sign-in provider: OIDC (`kind` oidc, entra or google) or SAML (`kind` saml)",
  description:
    "OIDC: `kind`, `clientId`, `clientSecret` and the issuer or tenant; SAML: `kind: saml`, `idpEntityId`, `ssoUrl` and public certificates. Saving SAML replaces an OIDC provider.",
  tags: ["identity"],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: z.unknown().describe("The provider's settings") } },
    },
  },
  responses: {
    200: json(z.strictObject({ provider: provider.nullable() }), "The provider now"),
    400: json(ErrorSchema, "The settings are not valid: `message` names the field"),
    401: notSignedIn,
    403: notAdmin,
    501: noSecretKey,
  },
});

export const deleteIdentityProviderRoute = defineRoute({
  method: "delete",
  path: "/api/identity-provider",
  summary: "Remove the sign-in provider",
  tags: ["identity"],
  responses: {
    204: { description: "Removed, and written to the audit log" },
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No provider is configured"),
  },
});

export const listConnectorClientsRoute = defineRoute({
  method: "get",
  path: "/api/connector-clients",
  summary: "The OAuth clients of the delegated connectors, without their secrets",
  tags: ["identity"],
  responses: {
    200: json(z.strictObject({ clients: z.array(z.looseObject({})) }), "The clients"),
    401: notSignedIn,
    403: notAdmin,
  },
});

const type = z.object({ type: z.string().describe("The connector type, e.g. `microsoft-365`") });

export const putConnectorClientRoute = defineRoute({
  method: "put",
  path: "/api/connector-clients/{type}",
  summary: "Set the OAuth client of a connector",
  description:
    "`authorizeUrl` and `tokenUrl` (https), `clientId`, and `clientSecret` (required for a new client, kept when left out for an existing one).",
  tags: ["identity"],
  request: {
    params: type,
    body: {
      required: true,
      content: { "application/json": { schema: z.unknown().describe("The client's settings") } },
    },
  },
  responses: {
    200: json(z.strictObject({ connector: z.string() }), "Updated"),
    201: json(z.strictObject({ connector: z.string() }), "Created"),
    400: json(ErrorSchema, "The settings are not valid: `message` names the field"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "Not a connector type"),
    501: noSecretKey,
  },
});

export const deleteConnectorClientRoute = defineRoute({
  method: "delete",
  path: "/api/connector-clients/{type}",
  summary: "Remove the OAuth client of a connector",
  tags: ["identity"],
  request: { params: type },
  responses: {
    204: { description: "Removed, and written to the audit log" },
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No OAuth client for this connector"),
  },
});
