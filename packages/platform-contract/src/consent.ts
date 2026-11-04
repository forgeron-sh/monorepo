import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// A person's OAuth consent for a delegated connector (docs/sdk.md section 10, D-048). Any signed-in
// person calls these for themselves; the scopes asked come from what the tool declared, never from the
// request. Two of them are steps of a browser flow, not calls of a client: the start answers `302` to
// the provider and the callback is where the provider sends the person back; a person who follows them
// sees an HTML page for an error, a client sees the JSON below.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const tool = z.string().describe("The tool's name");
const environment = z.enum(["preview", "production"]);
const refused = {
  401: json(ErrorSchema, "Not signed in"),
  404: json(ErrorSchema, "No such tool, or the tool declares no such connector"),
};

export const startConsentRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/environments/{environment}/consent/{name}",
  summary: "Send the person to the provider to consent to a connector of the tool",
  description: "`name` is the key of `resources.connectors` in the tool's latest version.",
  tags: ["consent"],
  request: { params: z.object({ tool, environment, name: z.string() }) },
  responses: {
    302: { description: "To the provider's authorization page" },
    ...refused,
    502: json(ErrorSchema, "The provider did not answer (`retryable`): try again"),
  },
});

export const consentCallbackRoute = defineRoute({
  method: "get",
  path: "/api/consent/callback",
  summary: "Where the provider sends the person back: keeps the tokens, sealed",
  tags: ["consent"],
  request: { query: z.object({ state: z.string(), code: z.string() }) },
  responses: {
    200: json(
      z.strictObject({ connected: z.literal(true), connector: z.string() }),
      "The consent is kept",
    ),
    400: json(ErrorSchema, "The state or the code is not valid"),
    401: json(ErrorSchema, "Not signed in"),
  },
});

export const listConsentsRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/environments/{environment}/consent",
  summary: "The person's own consents for the tool (no token)",
  tags: ["consent"],
  request: { params: z.object({ tool, environment }) },
  responses: {
    200: json(z.strictObject({ connections: z.array(z.looseObject({})) }), "The consents"),
    ...refused,
  },
});

export const withdrawConsentRoute = defineRoute({
  method: "delete",
  path: "/api/tools/{tool}/environments/{environment}/consent/{name}",
  summary: "The person withdraws their consent for a connector",
  tags: ["consent"],
  request: { params: z.object({ tool, environment, name: z.string() }) },
  responses: { 204: { description: "Withdrawn (or there was none)" }, ...refused },
});
