import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The workspace's GitHub App (D-123), for admins. An admin makes it from the console (GitHub's
// manifest flow, at `/github/app/new`), installs it on an organisation or an account, then lists the
// repositories it may see, links one to a tool in a click, or has a new repository made for a new
// tool. A repository's CI then deploys with GitHub Actions' identity: no token to copy.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const body = <T extends z.ZodType>(schema: T) => ({
  required: true,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");
const noApp = json(ErrorSchema, "The workspace has no GitHub App (`NOT_CONNECTED`)");
const REPO = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const toolName = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);
const branchName = z.string().min(1).max(200);

export const GithubInstallationSchema = z.strictObject({
  id: z.number().int(),
  /** The organisation or account it is installed on. */
  account: z.string(),
  accountType: z.enum(["Organization", "User"]),
});

export const GithubStatusSchema = z.strictObject({
  /** Whether this gateway can make one: it seals the app's keys (`SECRETS_KEY`) and signs state. */
  available: z.boolean(),
  app: z
    .strictObject({
      slug: z.string(),
      owner: z.string(),
      htmlUrl: z.string(),
      /** Where an admin installs it on an organisation or an account. */
      installUrl: z.string(),
      createdAt: z.string(),
    })
    .nullable(),
  installations: z.array(GithubInstallationSchema),
});

export const GithubRepositorySchema = z.strictObject({
  /** `owner/name`. */
  repo: z.string(),
  id: z.number().int(),
  private: z.boolean(),
  defaultBranch: z.string(),
  /** It has a `forgeron.config.ts` at its root: it holds a tool. */
  forgeron: z.boolean(),
  /** It has `.github/workflows/forgeron.yml`. */
  workflow: z.boolean(),
  /** The workspace's tool that comes from it, or `null`. */
  tool: z.string().nullable(),
});

export const getGithubRoute = defineRoute({
  method: "get",
  path: "/api/github",
  summary: "The workspace's GitHub App and where it is installed",
  tags: ["github"],
  responses: {
    200: json(GithubStatusSchema, "The app, or none"),
    401: notSignedIn,
    403: notAdmin,
  },
});

export const disconnectGithubRoute = defineRoute({
  method: "delete",
  path: "/api/github",
  summary: "Forget the workspace's GitHub App (it stays on GitHub, where its owner deletes it)",
  tags: ["github"],
  responses: {
    204: { description: "Forgotten" },
    401: notSignedIn,
    403: notAdmin,
    404: noApp,
  },
});

export const listGithubRepositoriesRoute = defineRoute({
  method: "get",
  path: "/api/github/repositories",
  summary: "The repositories the app's installations may see",
  tags: ["github"],
  responses: {
    200: json(
      z.strictObject({ repositories: z.array(GithubRepositorySchema) }),
      "The repositories",
    ),
    401: notSignedIn,
    403: notAdmin,
    404: noApp,
    502: json(ErrorSchema, "GitHub refused (`GITHUB`)"),
  },
});

export const linkGithubRepositoryRoute = defineRoute({
  method: "post",
  path: "/api/github/repositories/link",
  summary: "Add a tool from a repository the app may see; its CI deploys with no token",
  tags: ["github"],
  request: {
    body: body(
      z.object({
        repo: z.string().regex(REPO),
        name: toolName,
        productionBranch: branchName.optional(),
        /** Commits `.github/workflows/forgeron.yml` when the repository has none. */
        addWorkflow: z.boolean().optional(),
      }),
    ),
  },
  responses: {
    201: json(
      z.strictObject({
        tool: z.string(),
        repo: z.string(),
        productionBranch: z.string(),
        /** What was done about the workflow. */
        workflow: z.enum(["added", "present", "missing"]),
      }),
      "The tool",
    ),
    400: json(ErrorSchema, "Not a tool name or a repository"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No app (`NOT_CONNECTED`), or a repository it may not see"),
    409: json(ErrorSchema, "The workspace already has that tool, or the repository is linked"),
    502: json(ErrorSchema, "GitHub refused (`GITHUB`)"),
  },
});

export const createGithubToolRoute = defineRoute({
  method: "post",
  path: "/api/github/tools",
  summary: "Make a new tool: a repository made as `forgeron init` would, linked to it",
  tags: ["github"],
  request: {
    body: body(
      z.object({
        name: toolName,
        /** The organisation the repository is made in: one the app is installed on. */
        owner: z.string().regex(OWNER),
        private: z.boolean().optional(),
      }),
    ),
  },
  responses: {
    201: json(
      z.strictObject({
        tool: z.string(),
        repo: z.string(),
        /** The repository on GitHub. */
        url: z.string(),
      }),
      "The tool and its repository; its first push is on its way",
    ),
    400: json(
      ErrorSchema,
      "Not a tool name, or an account GitHub lets no app make a repository in",
    ),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No app (`NOT_CONNECTED`), or not installed on that owner"),
    409: json(ErrorSchema, "The workspace already has that tool, or the repository exists"),
    502: json(ErrorSchema, "GitHub refused (`GITHUB`)"),
  },
});
