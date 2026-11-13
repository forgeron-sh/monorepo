// GitHub's REST API for a workspace's GitHub App (D-123), on the `fetch` the gateway is given: a test
// gives a simulated GitHub. The app acts with a JWT it signs (its own calls) or with an installation
// token (on the repositories of one organisation or account). A token goes to api.github.com only.
import { importRsaPrivateKey, signRs256 } from "../identity/authn/jwt";

const API = "https://api.github.com";

export class GithubError extends Error {
  override name = "GithubError";
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** A repository as the console lists it. */
export interface GithubRepository {
  id: number;
  /** `owner/name`. */
  fullName: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
}

/** What GitHub gives once, when the app is made from its manifest. */
export interface ConvertedApp {
  id: number;
  slug: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  pem: string;
  owner: string;
  htmlUrl: string;
}

/** A GitHub Actions run, as the console shows it. */
export interface WorkflowRun {
  id: number;
  workflow: string;
  branch: string;
  /** The commit's message, first line. */
  message: string;
  sha: string;
  actor: string;
  status: "queued" | "in_progress" | "success" | "failure" | "cancelled";
  startedAt: string;
  /** Seconds, once it has finished. */
  durationSeconds: number | null;
  url: string;
}

/** GitHub's `status` and `conclusion` of a run in the five states the console knows. */
function runStatus(status: unknown, conclusion: unknown): WorkflowRun["status"] {
  if (status === "completed") {
    if (conclusion === "success" || conclusion === "neutral") return "success";
    return conclusion === "cancelled" || conclusion === "skipped" ? "cancelled" : "failure";
  }
  return status === "in_progress" ? "in_progress" : "queued";
}

const runOf = (r: Record<string, unknown>): WorkflowRun => {
  const status = runStatus(r.status, r.conclusion);
  const started = String(r.run_started_at ?? r.created_at ?? "");
  const ended = Date.parse(String(r.updated_at ?? ""));
  const begun = Date.parse(started);
  const finished = status === "success" || status === "failure" || status === "cancelled";
  return {
    id: Number(r.id),
    workflow: String(r.name ?? "Workflow"),
    branch: String(r.head_branch ?? ""),
    message: String((r.head_commit as { message?: unknown } | null)?.message ?? "").split("\n")[0]!,
    sha: String(r.head_sha ?? ""),
    actor: String(
      (r.triggering_actor as { login?: unknown } | null)?.login ??
        (r.actor as { login?: unknown } | null)?.login ??
        "",
    ),
    status,
    startedAt: started,
    durationSeconds:
      finished && Number.isFinite(ended) && Number.isFinite(begun)
        ? Math.max(0, Math.round((ended - begun) / 1000))
        : null,
    url: String(r.html_url ?? ""),
  };
};

const path = (repo: string) => repo.split("/").map(encodeURIComponent).join("/");

/** The app's own JWT: valid for nine minutes, from a minute ago (GitHub allows ten, and some skew). */
export async function appJwt(appId: number, privateKey: string, now: Date): Promise<string> {
  const at = Math.floor(now.getTime() / 1000);
  return signRs256(
    { iat: at - 60, exp: at + 9 * 60, iss: appId },
    await importRsaPrivateKey(privateKey),
  );
}

const repositoryOf = (r: Record<string, unknown>): GithubRepository => ({
  id: Number(r.id),
  fullName: String(r.full_name),
  owner: String((r.owner as { login?: unknown } | undefined)?.login ?? ""),
  private: r.private === true,
  defaultBranch: String(r.default_branch ?? "main"),
});

export function githubApi(fetcher: typeof fetch) {
  async function call<T>(
    route: string,
    options: { token?: string; method?: string; body?: unknown; ok404?: boolean } = {},
  ): Promise<T | undefined> {
    const response = await fetcher(`${API}${route}`, {
      method: options.method ?? "GET",
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "forgeron-gateway",
        "x-github-api-version": "2022-11-28",
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    if (response.status === 404 && options.ok404) return undefined;
    if (!response.ok) {
      const detail = await response
        .json()
        .then((b) => (b as { message?: unknown }).message)
        .catch(() => undefined);
      throw new GithubError(
        `GitHub answered ${response.status}${typeof detail === "string" ? `: ${detail}` : ""}.`,
        response.status,
      );
    }
    if (response.status === 204) return undefined;
    return (await response.json()) as T;
  }

  return {
    /** Trades the code of the manifest flow for the app and its keys (no authentication: the code is). */
    async convertManifest(code: string): Promise<ConvertedApp> {
      const r = (await call<Record<string, unknown>>(
        `/app-manifests/${encodeURIComponent(code)}/conversions`,
        { method: "POST" },
      ))!;
      return {
        id: Number(r.id),
        slug: String(r.slug),
        clientId: String(r.client_id),
        clientSecret: String(r.client_secret),
        webhookSecret: String(r.webhook_secret),
        pem: String(r.pem),
        owner: String((r.owner as { login?: unknown } | undefined)?.login ?? ""),
        htmlUrl: String(r.html_url),
      };
    },

    /** Where an installation of the app is: asked with the app's JWT. */
    async installation(
      jwt: string,
      id: number,
    ): Promise<{ account: string; accountType: "Organization" | "User" }> {
      const r = (await call<{ account?: { login?: unknown; type?: unknown } }>(
        `/app/installations/${id}`,
        { token: jwt },
      ))!;
      return {
        account: String(r.account?.login ?? ""),
        accountType: r.account?.type === "User" ? "User" : "Organization",
      };
    },

    /** A token for an installation's repositories: an hour, never kept. */
    async installationToken(jwt: string, id: number): Promise<string> {
      const r = (await call<{ token: string }>(`/app/installations/${id}/access_tokens`, {
        token: jwt,
        method: "POST",
      }))!;
      return r.token;
    },

    /** The repositories an installation may act on (the first hundred). */
    async repositories(token: string): Promise<GithubRepository[]> {
      const r = await call<{ repositories?: Record<string, unknown>[] }>(
        "/installation/repositories?per_page=100",
        { token },
      );
      return (r?.repositories ?? []).map(repositoryOf);
    },

    /** Whether a file is on a repository's default branch (or `ref`). */
    async hasFile(token: string, repo: string, file: string, ref?: string): Promise<boolean> {
      const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
      return (
        (await call(`/repos/${path(repo)}/contents/${file}${query}`, { token, ok404: true })) !==
        undefined
      );
    },

    /**
     * A new repository in an organisation, with a first commit (GitHub's README) so that files can be
     * added through the git API: an empty repository has no branch to add them to.
     */
    async createRepository(
      token: string,
      owner: string,
      input: { name: string; private: boolean; description?: string },
    ): Promise<GithubRepository> {
      const r = (await call<Record<string, unknown>>(`/orgs/${encodeURIComponent(owner)}/repos`, {
        token,
        method: "POST",
        body: { ...input, auto_init: true },
      }))!;
      return repositoryOf(r);
    },

    /** Adds files to a branch in one commit (git trees), and returns the commit's sha. */
    async commitFiles(
      token: string,
      repo: string,
      branch: string,
      files: Record<string, string>,
      message: string,
    ): Promise<string> {
      const base = `/repos/${path(repo)}`;
      const ref = (await call<{ object: { sha: string } }>(
        `${base}/git/ref/heads/${encodeURIComponent(branch)}`,
        { token },
      ))!;
      const parent = (await call<{ tree: { sha: string } }>(
        `${base}/git/commits/${ref.object.sha}`,
        { token },
      ))!;
      const tree = (await call<{ sha: string }>(`${base}/git/trees`, {
        token,
        method: "POST",
        body: {
          base_tree: parent.tree.sha,
          tree: Object.entries(files).map(([file, content]) => ({
            path: file,
            mode: "100644",
            type: "blob",
            content,
          })),
        },
      }))!;
      const commit = (await call<{ sha: string }>(`${base}/git/commits`, {
        token,
        method: "POST",
        body: { message, tree: tree.sha, parents: [ref.object.sha] },
      }))!;
      await call(`${base}/git/refs/heads/${encodeURIComponent(branch)}`, {
        token,
        method: "PATCH",
        body: { sha: commit.sha },
      });
      return commit.sha;
    },

    /**
     * The latest GitHub Actions runs of a repository, newest first. Needs the app's `actions: read`
     * permission: without it GitHub answers 403 or 404, which the caller maps (a `GithubError`).
     */
    async workflowRuns(
      token: string,
      repo: string,
      options: { branch?: string; limit?: number } = {},
    ): Promise<WorkflowRun[]> {
      const query = new URLSearchParams({ per_page: String(options.limit ?? 20) });
      if (options.branch) query.set("branch", options.branch);
      const r = await call<{ workflow_runs?: Record<string, unknown>[] }>(
        `/repos/${path(repo)}/actions/runs?${query}`,
        { token },
      );
      return (r?.workflow_runs ?? []).map(runOf);
    },

    /** A commit status: what GitHub shows beside the commit, with a link. */
    async setStatus(
      token: string,
      repo: string,
      sha: string,
      status: {
        state: "success" | "failure";
        targetUrl: string;
        context: string;
        description: string;
      },
    ): Promise<void> {
      await call(`/repos/${path(repo)}/statuses/${encodeURIComponent(sha)}`, {
        token,
        method: "POST",
        body: {
          state: status.state,
          target_url: status.targetUrl,
          context: status.context,
          description: status.description,
        },
      });
    },
  };
}

export type GithubApi = ReturnType<typeof githubApi>;
