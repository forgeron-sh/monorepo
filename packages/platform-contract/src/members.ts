import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The people of the workspace and how they get in (D-049, D-136). Every change is audited by the
// registry, in the same batch as the write. A member is never told apart from another by anything but
// their teams; `admin` is never a default team. Adding a person to a team, or taking them out, is
// limited to what the caller holds themselves: they may only change a team whose permissions they
// have (`FORBIDDEN` otherwise).

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAllowed = json(ErrorSchema, "Lacks the permission");
const notAllowedToGive = json(
  ErrorSchema,
  "Lacks the permission, or does not hold the permissions of a team named (`FORBIDDEN`)",
);
const registryRefusal = json(ErrorSchema, "The registry refused: `error` is its code");

export const MAX_TEAMS = 20;
export const MAX_DOMAINS = 50;
const teams = z.array(z.string()).max(MAX_TEAMS);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MemberSchema = z.strictObject({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  /** The ids of the teams the person is in; everyone is also part of `everyone`, which is not listed. */
  teams: z.array(z.string()),
});
const MembershipSettingsSchema = z.strictObject({
  /** The domains whose addresses join by themselves; from the install until someone saves their own. */
  domains: z.array(z.string()),
  /** The teams a person who joins by domain is put in. Never `admin`. */
  defaultTeams: z.array(z.string()),
  source: z.enum(["console", "install"]),
});

export const listMembersRoute = defineRoute({
  method: "get",
  path: "/api/members",
  summary: "The members, the pending invitations and who joins by email domain",
  tags: ["members"],
  responses: {
    200: json(
      z.strictObject({
        members: z.array(MemberSchema),
        invitations: z.array(
          z.strictObject({
            email: z.string(),
            teams: z.array(z.string()),
            invitedBy: z.string(),
            expiresAt: z.string(),
          }),
        ),
        settings: MembershipSettingsSchema,
      }),
      "The people",
    ),
    401: notSignedIn,
    403: notAllowed,
  },
});

export const setMemberTeamsRoute = defineRoute({
  method: "patch",
  path: "/api/members/{id}",
  summary: "Change the teams a member is in",
  description:
    "Replaces the member's teams. Each team added or removed is a change of who holds its permissions: the caller needs the permission to change members and to hold the team's permissions themselves.",
  tags: ["members"],
  request: {
    params: z.object({ id: z.string() }),
    body: { required: true, content: { "application/json": { schema: z.object({ teams }) } } },
  },
  responses: {
    200: json(MemberSchema, "The member now"),
    400: json(ErrorSchema, "`teams` is a list of team ids"),
    401: notSignedIn,
    403: notAllowedToGive,
    404: json(ErrorSchema, "No such member"),
    409: json(ErrorSchema, "The registry refused (the last admin cannot leave the admin team)"),
  },
});

export const removeMemberRoute = defineRoute({
  method: "delete",
  path: "/api/members/{id}",
  summary: "Remove a member",
  tags: ["members"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: "Removed" },
    401: notSignedIn,
    403: notAllowed,
    404: json(ErrorSchema, "No such member"),
    409: json(ErrorSchema, "The registry refused (the last admin cannot be removed)"),
  },
});

export const inviteMemberRoute = defineRoute({
  method: "post",
  path: "/api/invitations",
  summary: "Invite an email address, and tell it by mail when the install can send one",
  tags: ["members"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            email: z
              .string()
              .refine((v) => v.trim().length <= 254 && EMAIL.test(v.trim()))
              .describe("An address; trimmed and lower-cased"),
            teams: teams.optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: json(
      z.strictObject({
        invitation: z.strictObject({
          email: z.string(),
          teams: z.array(z.string()),
          expiresAt: z.string(),
        }),
        /** `false` when no mail could be sent: whoever invited gives the link themselves. */
        notified: z.boolean(),
      }),
      "The invitation",
    ),
    400: json(ErrorSchema, "`email` is required, `teams` a list of team ids"),
    401: notSignedIn,
    403: notAllowedToGive,
    409: registryRefusal,
  },
});

export const withdrawInvitationRoute = defineRoute({
  method: "delete",
  path: "/api/invitations/{email}",
  summary: "Withdraw an invitation",
  tags: ["members"],
  request: { params: z.object({ email: z.string().describe("URL-encoded") }) },
  responses: {
    204: { description: "Withdrawn" },
    401: notSignedIn,
    403: notAllowed,
    404: json(ErrorSchema, "No such invitation"),
  },
});

export const getMembershipSettingsRoute = defineRoute({
  method: "get",
  path: "/api/membership-settings",
  summary: "Who joins by email domain, and in which teams",
  tags: ["members"],
  responses: {
    200: json(MembershipSettingsSchema, "The settings"),
    401: notSignedIn,
    403: notAllowed,
  },
});

export const putMembershipSettingsRoute = defineRoute({
  method: "put",
  path: "/api/membership-settings",
  summary: "Set who joins by email domain, and in which teams",
  tags: ["members"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            domains: z.array(z.string()).max(MAX_DOMAINS),
            /** None: nobody is put in a team. Never `admin`. */
            defaultTeams: teams.optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: json(MembershipSettingsSchema, "The settings now"),
    400: json(ErrorSchema, "`domains` is a list of domains; `defaultTeams` a list of team ids"),
    401: notSignedIn,
    403: notAllowedToGive,
    409: registryRefusal,
  },
});
