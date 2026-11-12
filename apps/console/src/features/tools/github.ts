import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient, typedSender, type Api } from "../../api";

// The workspace's GitHub App (D-123), as the console reads and uses it: Settings → GitHub shows it,
// "Add from GitHub" lists its repositories and links one, "New tool" has a repository made.

export interface GithubStatus {
  available: boolean;
  app: {
    slug: string;
    owner: string;
    htmlUrl: string;
    installUrl: string;
    createdAt: string;
  } | null;
  installations: Array<{ id: number; account: string; accountType: "Organization" | "User" }>;
}

export interface GithubRepository {
  repo: string;
  id: number;
  private: boolean;
  defaultBranch: string;
  forgeron: boolean;
  workflow: boolean;
  tool: string | null;
}

export const loadGithub = async (api: Api): Promise<GithubStatus> =>
  ok(await typedClient(api.fetchJson)(addresses.getGithub));

export const loadGithubRepositories = async (api: Api): Promise<GithubRepository[]> =>
  ok(await typedClient(api.fetchJson)(addresses.listGithubRepositories)).repositories;

export const linkGithubRepository = async (
  api: Api,
  input: { repo: string; name: string; productionBranch?: string; addWorkflow?: boolean },
) => ok(await typedSender(api.sendJson)(addresses.linkGithubRepository, { json: input }));

export const createGithubTool = async (
  api: Api,
  input: { name: string; owner: string; private?: boolean },
) => ok(await typedSender(api.sendJson)(addresses.createGithubTool, { json: input }));

export const disconnectGithub = async (api: Api) => {
  ok(await typedSender(api.sendJson)(addresses.disconnectGithub));
};

/** Where the browser goes to create the app (a page of the gateway, outside the console's API). */
export const newAppHref = (owner: string) =>
  `/github/app/new${owner.trim() ? `?owner=${encodeURIComponent(owner.trim())}` : ""}`;

/** A tool's name from a repository's: what `forgeron init` accepts. */
export const toolNameOf = (repo: string) =>
  (repo.split("/")[1] ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/-+$/, "")
    .slice(0, 40);
