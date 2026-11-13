import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";
import { MAX_SECRET_VALUE } from "./secrets";

// Entering a secret from a link (docs/sdk.md §17). A developer, or the admin MCP for them, asks for a
// link; the person opens it, signed in, and types the value in the console. The value goes from the
// page to the gateway in a body and nowhere else: not in a path, a query, an answer or a log, and
// the token of the link travels in a body too, never in a path.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const token = z.string().min(20).max(200).describe("The token of the link, from its `#` part");

export const createSecretRequestRoute = defineRoute({
  method: "post",
  path: "/api/tools/{tool}/environments/{environment}/secrets/{name}/request",
  summary: "A short-lived, single-use link where the caller types a secret themselves",
  description:
    "The link is bound to the caller, the tool, the environment and the secret name. It lives 15 minutes and works once. No value is taken or returned.",
  tags: ["secrets"],
  request: {
    params: z.object({
      tool: z.string().describe("The tool's name"),
      environment: z.string().describe("`preview` or `production`; any other is a 404"),
      name: z.string().describe("`A-Z`, digits and `_`, from a letter"),
    }),
  },
  responses: {
    201: json(
      z.strictObject({ url: z.string(), expiresAt: z.string() }),
      "The link, shown once, and when it stops working",
    ),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Lacks the permission"),
    404: json(ErrorSchema, "No such tool, environment or secret name"),
    500: json(ErrorSchema, "The registry refused: `error` is its code"),
  },
});

export const lookupSecretRequestRoute = defineRoute({
  method: "post",
  path: "/api/secret-requests/lookup",
  summary: "Where a link's secret goes, for the person it was issued to",
  description:
    "Spends nothing. A link that is unknown, another person's, used or expired answers 404 with the same body, except that an expired one says so with 410.",
  tags: ["secrets"],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: z.strictObject({ token }) } },
    },
  },
  responses: {
    200: json(
      z.strictObject({
        tool: z.string(),
        environment: z.string(),
        name: z.string(),
        expiresAt: z.string(),
      }),
      "What the link is for",
    ),
    400: json(ErrorSchema, "The body is not `{ token }`"),
    401: json(ErrorSchema, "Not signed in"),
    404: json(ErrorSchema, "No such link for this person, or it was used"),
    410: json(ErrorSchema, "The link expired"),
  },
});

export const fulfilSecretRequestRoute = defineRoute({
  method: "post",
  path: "/api/secret-requests/fulfil",
  summary: "Set the secret a link was issued for; the link is spent",
  description:
    "Only the person the link was issued to, signed in, may use it, once, before it expires. The value is sealed in the registry and never comes out.",
  tags: ["secrets"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.strictObject({ token, value: z.string().min(1).max(MAX_SECRET_VALUE) }),
        },
      },
    },
  },
  responses: {
    204: { description: "Set; the link no longer works" },
    400: json(ErrorSchema, "`token` and a non-empty `value` (16 KB max)"),
    401: json(ErrorSchema, "Not signed in"),
    404: json(ErrorSchema, "No such link for this person, or it was used"),
    410: json(ErrorSchema, "The link expired"),
    500: json(ErrorSchema, "The registry refused: `error` is its code"),
  },
});
