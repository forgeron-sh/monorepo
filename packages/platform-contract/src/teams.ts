import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The workspace's teams (D-132): named groups of members. Anyone signed in reads them (a tool's
// directory shows them too); an admin changes them. Each change is audited by the registry.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");
const registryRefusal = json(ErrorSchema, "The registry refused: `error` is its code");

export const TEAM_SLUG = /^[a-z][a-z0-9-]{1,33}$/;

const TeamSchema = z.strictObject({
  id: z.string().describe("The team's address, chosen once"),
  name: z.string(),
  description: z.string(),
  /** The ids of its members. */
  members: z.array(z.string()),
  /** What the team is called in the access matrix. */
  role: z.string(),
});

const memberIds = z.array(z.string()).max(500);

export const listTeamsRoute = defineRoute({
  method: "get",
  path: "/api/teams",
  summary: "The teams of the workspace",
  tags: ["teams"],
  responses: {
    200: json(z.strictObject({ teams: z.array(TeamSchema) }), "The teams"),
    401: notSignedIn,
  },
});

export const createTeamRoute = defineRoute({
  method: "post",
  path: "/api/teams",
  summary: "Create a team",
  tags: ["teams"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            id: z.string().regex(TEAM_SLUG),
            name: z.string().min(1).max(80),
            description: z.string().max(300).optional(),
            members: memberIds.optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: json(TeamSchema, "The team"),
    400: json(ErrorSchema, "`id`, `name` and `members` are required"),
    401: notSignedIn,
    403: notAdmin,
    409: registryRefusal,
  },
});

export const updateTeamRoute = defineRoute({
  method: "patch",
  path: "/api/teams/{id}",
  summary: "Rename a team or replace its members",
  tags: ["teams"],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1).max(80).optional(),
            description: z.string().max(300).optional(),
            members: memberIds.optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: json(TeamSchema, "The team now"),
    400: json(ErrorSchema, "`name`, `description` or `members` are invalid"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such team"),
    409: registryRefusal,
  },
});

export const deleteTeamRoute = defineRoute({
  method: "delete",
  path: "/api/teams/{id}",
  summary: "Delete a team, and what it was given in tools",
  tags: ["teams"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: "Deleted" },
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such team"),
  },
});
