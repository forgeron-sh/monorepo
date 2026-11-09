import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The admin's revocations (D-035, D-036), for admins. A value never comes out.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const tool = z.string().describe("The tool's name");
const person = z.string().describe("The person's id, URL-encoded");
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");

export const revokePersonTokensRoute = defineRoute({
  method: "post",
  path: "/api/people/{id}/tokens/revoke",
  summary: "Revoke every token of a person, at once",
  tags: ["revocations"],
  request: { params: z.object({ id: person }) },
  responses: {
    200: json(z.strictObject({ revoked: z.literal("all"), person: z.string() }), "Revoked"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "There is no such person"),
  },
});

export const listUserSecretHoldersRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/user-secrets",
  summary: "Who holds which per-person secrets: names only",
  tags: ["revocations"],
  request: { params: z.object({ tool }) },
  responses: {
    200: json(
      z.strictObject({
        holders: z.array(z.strictObject({ person: z.string(), names: z.array(z.string()) })),
      }),
      "The holders",
    ),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
  },
});

const revoked = json(z.strictObject({ revoked: z.number().int() }), "How many were revoked");

export const revokeUserSecretsRoute = defineRoute({
  method: "delete",
  path: "/api/tools/{tool}/user-secrets/{person}",
  summary: "Revoke all the per-person secrets of one person",
  tags: ["revocations"],
  request: { params: z.object({ tool, person }) },
  responses: {
    200: revoked,
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
  },
});

export const revokeUserSecretRoute = defineRoute({
  method: "delete",
  path: "/api/tools/{tool}/user-secrets/{person}/{name}",
  summary: "Revoke one per-person secret of one person",
  tags: ["revocations"],
  request: {
    params: z.object({ tool, person, name: z.string().describe("`A-Z`, digits and `_`") }),
  },
  responses: {
    200: revoked,
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
  },
});

// The plain values of a tool's setup (D-097) are in clear and the admin may read them, unlike a secret.

export const listUserSetupRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/user-setup",
  summary: "What each person gave a tool's setup: their plain values",
  tags: ["revocations"],
  request: { params: z.object({ tool }) },
  responses: {
    200: json(
      z.strictObject({
        people: z.array(
          z.strictObject({
            person: z.string(),
            /** The member's name and email; empty if the person left. */
            name: z.string(),
            email: z.string(),
            values: z.record(z.string(), z.string()),
          }),
        ),
      }),
      "The people",
    ),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
  },
});

export const clearUserSetupRoute = defineRoute({
  method: "delete",
  path: "/api/tools/{tool}/user-setup/{person}",
  summary: "Clear all the plain values of one person for a tool: they are asked again",
  tags: ["revocations"],
  request: { params: z.object({ tool, person }) },
  responses: {
    200: revoked,
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
  },
});

export const clearUserSetupValueRoute = defineRoute({
  method: "delete",
  path: "/api/tools/{tool}/user-setup/{person}/{name}",
  summary: "Clear one plain value of one person for a tool",
  tags: ["revocations"],
  request: {
    params: z.object({ tool, person, name: z.string().describe("The field's name, `camelCase`") }),
  },
  responses: {
    200: revoked,
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
  },
});
