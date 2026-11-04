import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The people of the workspace and how they get in (D-049), for admins. Every change is audited by the
// registry, in the same batch as the write. A member is never told apart from another by anything but
// their roles; `admin` is never a default role.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");
const registryRefusal = json(ErrorSchema, "The registry refused: `error` is its code");

export const MAX_ROLES = 20;
export const MAX_DOMAINS = 50;
const roles = z.array(z.string()).max(MAX_ROLES);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MemberSchema = z.strictObject({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
});
const MembershipSettingsSchema = z.strictObject({
  /** The domains whose addresses join by themselves; from the install until an admin saves their own. */
  domains: z.array(z.string()),
  defaultRole: z.string().optional(),
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
            roles: z.array(z.string()),
            invitedBy: z.string(),
            expiresAt: z.string(),
          }),
        ),
        settings: MembershipSettingsSchema,
      }),
      "The people",
    ),
    401: notSignedIn,
    403: notAdmin,
  },
});

export const setMemberRolesRoute = defineRoute({
  method: "patch",
  path: "/api/members/{id}",
  summary: "Change a member's roles",
  tags: ["members"],
  request: {
    params: z.object({ id: z.string() }),
    body: { required: true, content: { "application/json": { schema: z.object({ roles }) } } },
  },
  responses: {
    200: json(MemberSchema, "The member now"),
    400: json(ErrorSchema, "`roles` is a list of role names"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such member"),
    409: registryRefusal,
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
    403: notAdmin,
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
            roles: roles.optional(),
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
          roles: z.array(z.string()),
          expiresAt: z.string(),
        }),
        /** `false` when no mail could be sent: the admin gives the link themselves. */
        notified: z.boolean(),
      }),
      "The invitation",
    ),
    400: json(ErrorSchema, "`email` and `roles` (a list of role names) are required"),
    401: notSignedIn,
    403: notAdmin,
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
    403: notAdmin,
    404: json(ErrorSchema, "No such invitation"),
  },
});

export const getMembershipSettingsRoute = defineRoute({
  method: "get",
  path: "/api/membership-settings",
  summary: "Who joins by email domain, and with which role",
  tags: ["members"],
  responses: {
    200: json(MembershipSettingsSchema, "The settings"),
    401: notSignedIn,
    403: notAdmin,
  },
});

export const putMembershipSettingsRoute = defineRoute({
  method: "put",
  path: "/api/membership-settings",
  summary: "Set who joins by email domain, and with which role",
  tags: ["members"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            domains: z.array(z.string()).max(MAX_DOMAINS),
            defaultRole: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: json(MembershipSettingsSchema, "The settings now"),
    400: json(ErrorSchema, "`domains` is a list of domains; `defaultRole` a role name or null"),
    401: notSignedIn,
    403: notAdmin,
    409: registryRefusal,
  },
});
