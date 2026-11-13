import { PLATFORM, TEAM_ID, type PlatformPermission } from "@forgeron/permissions";
import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The workspace's teams (D-132, D-137): named groups of members, and what each may do on Forgeron.
// Anyone signed in reads them (a tool's directory shows them too); who holds `teams:write` changes
// them, within what they hold themselves (anti-escalation: `FORBIDDEN`). Each change is audited by
// the registry. `admin` and `developer` are built into every workspace: they cannot be deleted,
// `admin` always holds every permission and keeps at least one member.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAllowed = json(
  ErrorSchema,
  "Lacks the permission, or does not hold the permissions it would give or take away (`FORBIDDEN`)",
);
const registryRefusal = json(ErrorSchema, "The registry refused: `error` is its code");

export const TEAM_SLUG = TEAM_ID;

/** A permission of the platform. */
const PlatformPermissionSchema = z.enum(
  Object.keys(PLATFORM.permissions) as [PlatformPermission, ...PlatformPermission[]],
);

const TeamSchema = z.strictObject({
  id: z.string().describe("The team's address, chosen once"),
  name: z.string(),
  description: z.string(),
  /** The ids of its members. */
  members: z.array(z.string()),
  /** Created with every workspace (`admin`, `developer`): it cannot be deleted. */
  builtIn: z.boolean(),
  /** Its permissions cannot be changed: `admin` always holds every one. */
  locked: z.boolean(),
  /** What it was given, as stored: the fewest grants, `["*"]` for every permission, now and to come. */
  permissions: z.array(z.string()),
  /** Every permission it gives, the implied ones included. */
  effective: z.array(PlatformPermissionSchema),
});

const memberIds = z.array(z.string()).max(500);
/** Permission names of the catalog, or `*`. */
const permissions = z.array(z.string().min(1).max(64)).max(64);

export const listTeamsRoute = defineRoute({
  method: "get",
  path: "/api/teams",
  summary: "The teams of the workspace",
  tags: ["teams"],
  responses: {
    200: json(z.strictObject({ teams: z.array(TeamSchema) }), "The teams, built-in ones first"),
    401: notSignedIn,
  },
});

export const listPermissionsRoute = defineRoute({
  method: "get",
  path: "/api/permissions",
  summary: "The platform permissions a team may be given",
  description:
    "The catalog the console draws team permissions from: groups of permissions, each with its label, a sentence, and the permissions it implies (a write gives its read).",
  tags: ["teams"],
  responses: {
    200: json(
      z.strictObject({
        groups: z.array(
          z.strictObject({
            label: z.string(),
            permissions: z.array(
              z.strictObject({
                name: PlatformPermissionSchema,
                label: z.string(),
                description: z.string(),
                implies: z.array(PlatformPermissionSchema),
              }),
            ),
          }),
        ),
      }),
      "The catalog",
    ),
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
            permissions: permissions.optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: json(TeamSchema, "The team"),
    400: json(ErrorSchema, "`id`, `name`, `members` or `permissions` are invalid"),
    401: notSignedIn,
    403: notAllowed,
    409: registryRefusal,
  },
});

export const updateTeamRoute = defineRoute({
  method: "patch",
  path: "/api/teams/{id}",
  summary: "Rename a team, replace its members or its permissions",
  description:
    "A change of members or permissions is limited to what the caller holds: the team's permissions before and after must be permissions they hold (`FORBIDDEN` names what they lack). The admin team's permissions cannot be changed, and it cannot be left with no member (409).",
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
            permissions: permissions.optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: json(TeamSchema, "The team now"),
    400: json(ErrorSchema, "`name`, `description`, `members` or `permissions` are invalid"),
    401: notSignedIn,
    403: notAllowed,
    404: json(ErrorSchema, "No such team"),
    409: json(
      ErrorSchema,
      "The registry refused: `PROTECTED` (the admin team's permissions are locked) or `LAST_ADMIN`",
    ),
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
    403: json(ErrorSchema, "Lacks the permission"),
    404: json(ErrorSchema, "No such team"),
    409: json(ErrorSchema, "A built-in team cannot be deleted (`PROTECTED`)"),
  },
});
