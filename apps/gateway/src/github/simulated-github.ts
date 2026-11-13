// A simulated GitHub for the gateway's tests (D-123): GitHub Actions' identity tokens signed by a real
// RSA key and its JWKS, and the REST calls a workspace's app makes, on a small in-memory GitHub. The
// app's private key is made here and handed over as GitHub does (PKCS#1); each call the app signs is
// checked against its public key. Nothing reaches the network.
import { signRs256, verifyRs256, type Jwk } from "../identity/authn/jwt";
import { ACTIONS_ISSUER } from "./actions-oidc";

const rsa = () =>
  crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );

/** The PKCS#1 key inside a PKCS#8 one (the content of its OCTET STRING), as a PEM. */
function pkcs1Pem(pkcs8: Uint8Array): string {
  let at = 1;
  const length = () => {
    const first = pkcs8[at++]!;
    if (first < 0x80) return first;
    let value = 0;
    for (let i = 0; i < (first & 0x7f); i++) value = (value << 8) | pkcs8[at++]!;
    return value;
  };
  length();
  at += 3;
  at += 2 + pkcs8[at + 1]!;
  at += 1; // OCTET STRING
  const size = length();
  const der = pkcs8.slice(at, at + size);
  const lines = btoa(String.fromCharCode(...der)).match(/.{1,64}/g)!;
  return `-----BEGIN RSA PRIVATE KEY-----\n${lines.join("\n")}\n-----END RSA PRIVATE KEY-----\n`;
}

export interface SimulatedRepository {
  id: number;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  /** Path to content, on the default branch. */
  files: Record<string, string>;
  /** The commits made through the git API, newest last. */
  commits: { sha: string; message: string; files: Record<string, string> }[];
}

/** A GitHub Actions run of a simulated repository, as GitHub's REST API names its fields. */
export interface SimulatedRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  head_commit: { message: string };
  actor: { login: string };
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | null;
  run_started_at: string;
  updated_at: string;
  html_url: string;
}

/** A release of a simulated public repository: what `GET /repos/{repo}/releases` lists, and its files. */
export interface SimulatedRelease {
  tag: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  publishedAt: string;
  /** The files attached to the release, by name. */
  files: Record<string, string | Uint8Array>;
}

export async function simulatedGithub(options: { now: () => Date; account?: string }) {
  const account = options.account ?? "acme-sh";
  const actions = await rsa();
  const actionsJwk = {
    ...(await crypto.subtle.exportKey("jwk", actions.publicKey)),
    kid: "actions-1",
  } as Jwk;
  const app = await rsa();
  // The app's JWT names no key: the one key is found with no `kid`.
  const appJwk = (await crypto.subtle.exportKey("jwk", app.publicKey)) as Jwk;
  const pem = pkcs1Pem(new Uint8Array(await crypto.subtle.exportKey("pkcs8", app.privateKey)));

  const state = {
    /** The codes of the manifest flow GitHub would give; one use each. */
    codes: new Set<string>(["code-1"]),
    installations: new Map<number, { account: string; type: "Organization" | "User" }>([
      [7, { account, type: "Organization" }],
    ]),
    repositories: new Map<string, SimulatedRepository>(),
    /** The runs of each repository (lower case `owner/name`), newest first. */
    runs: new Map<string, SimulatedRun[]>(),
    /** Whether the app may read Actions: an installation made before it asked for it may not. */
    actionsAllowed: true,
    /** The releases of each public repository (lower case `owner/name`), in the order added. */
    releases: new Map<string, SimulatedRelease[]>(),
    /** The `authorization` header of every request for releases or their files: none is ever sent (D-138). */
    releaseAuthorizations: [] as (string | null)[],
    statuses: [] as { repo: string; sha: string; body: Record<string, unknown> }[],
    calls: [] as string[],
    webhookSecret: "simulated-webhook-secret",
  };
  let nextId = 1000;
  let nextSha = 1;
  const sha = () => (nextSha++).toString(16).padStart(40, "0");

  const addRepository = (fullName: string, files: Record<string, string> = {}, id = nextId++) => {
    const repo: SimulatedRepository = {
      id,
      fullName,
      private: true,
      defaultBranch: "main",
      files,
      commits: [],
    };
    state.repositories.set(fullName.toLowerCase(), repo);
    return repo;
  };

  /** Adds a release to a public repository, and the files it carries. */
  const addRelease = (
    repository: string,
    release: Partial<SimulatedRelease> & { tag: string },
  ): SimulatedRelease => {
    const added: SimulatedRelease = {
      body: "",
      draft: false,
      prerelease: false,
      publishedAt: options.now().toISOString(),
      files: {},
      ...release,
    };
    const key = repository.toLowerCase();
    state.releases.set(key, [...(state.releases.get(key) ?? []), added]);
    return added;
  };

  /** A GitHub Actions identity token for a run of `repository`, for `audience`. */
  const actionsToken = (claims: {
    repository: string;
    repositoryId?: number;
    audience: string;
    sha?: string;
    expiresIn?: number;
  }) => {
    const at = Math.floor(options.now().getTime() / 1000);
    return signRs256(
      {
        iss: ACTIONS_ISSUER,
        aud: claims.audience,
        sub: `repo:${claims.repository}:ref:refs/heads/main`,
        repository: claims.repository,
        repository_id: String(claims.repositoryId ?? 1),
        ref: "refs/heads/main",
        sha: claims.sha ?? "a".repeat(40),
        actor: "someone",
        iat: at,
        nbf: at,
        exp: at + (claims.expiresIn ?? 300),
      },
      actions.privateKey,
      "actions-1",
    );
  };

  const appSigned = async (request: Request) => {
    const token = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
    if (!token) return false;
    try {
      const claims = await verifyRs256(token, [appJwk]);
      const now = options.now().getTime() / 1000;
      return claims.iss === 42 && typeof claims.exp === "number" && claims.exp > now;
    } catch {
      return false;
    }
  };
  const installationTokens = new Map<string, number>();
  const installationOf = (request: Request) =>
    installationTokens.get(
      /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1] ?? "",
    );

  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    state.calls.push(`${request.method} ${url.pathname}`);
    const body = async () => (request.body ? await request.json() : {}) as Record<string, unknown>;
    const route = url.pathname;
    let m: RegExpExecArray | null;

    if (url.origin === ACTIONS_ISSUER && route === "/.well-known/jwks") {
      return Response.json({ keys: [actionsJwk] });
    }
    // Public releases, as anyone reads them with no token (D-138): the list, then each file.
    if (url.origin === "https://github.com") {
      state.releaseAuthorizations.push(request.headers.get("authorization"));
      m = /^\/([^/]+\/[^/]+)\/releases\/download\/([^/]+)\/([^/]+)$/.exec(route);
      const file = m
        ? state.releases.get(m[1]!.toLowerCase())?.find((r) => r.tag === decodeURIComponent(m![2]!))
            ?.files[decodeURIComponent(m[3]!)]
        : undefined;
      return file === undefined
        ? new Response("Not Found", { status: 404 })
        : new Response(file, {
            headers: {
              "content-length": String(
                typeof file === "string" ? new TextEncoder().encode(file).length : file.length,
              ),
            },
          });
    }
    if (url.origin !== "https://api.github.com") return new Response("nope", { status: 404 });
    if ((m = /^\/repos\/([^/]+\/[^/]+)\/releases$/.exec(route)) && request.method === "GET") {
      state.releaseAuthorizations.push(request.headers.get("authorization"));
      const list = state.releases.get(decodeURIComponent(m[1]!).toLowerCase());
      if (!list) return Response.json({ message: "Not Found" }, { status: 404 });
      return Response.json(
        list.map((r) => ({
          tag_name: r.tag,
          draft: r.draft,
          prerelease: r.prerelease,
          published_at: r.publishedAt,
          html_url: `https://github.com/${m![1]}/releases/tag/${r.tag}`,
          body: r.body,
          assets: Object.keys(r.files).map((name) => ({ name })),
        })),
      );
    }

    if ((m = /^\/app-manifests\/([^/]+)\/conversions$/.exec(route)) && request.method === "POST") {
      if (!state.codes.delete(m[1]!))
        return Response.json({ message: "Not Found" }, { status: 404 });
      return Response.json({
        id: 42,
        slug: "forgeron-acme",
        client_id: "Iv1.simulated",
        client_secret: "simulated-client-secret",
        webhook_secret: state.webhookSecret,
        pem,
        owner: { login: account, type: "Organization" },
        html_url: "https://github.com/apps/forgeron-acme",
      });
    }
    if ((m = /^\/app\/installations\/(\d+)(\/access_tokens)?$/.exec(route))) {
      if (!(await appSigned(request)))
        return Response.json({ message: "Bad JWT" }, { status: 401 });
      const id = Number(m[1]);
      const found = state.installations.get(id);
      if (!found) return Response.json({ message: "Not Found" }, { status: 404 });
      if (m[2]) {
        const token = `ghs_simulated_${id}_${installationTokens.size}`;
        installationTokens.set(token, id);
        return Response.json({ token }, { status: 201 });
      }
      return Response.json({ id, account: { login: found.account, type: found.type } });
    }
    // Everything else is the installation's.
    const installation = installationOf(request);
    if (installation === undefined) {
      return Response.json({ message: "Requires authentication" }, { status: 401 });
    }
    const owner = state.installations.get(installation)!.account.toLowerCase();
    const mine = (full: string) => full.toLowerCase().startsWith(`${owner}/`);

    if (route === "/installation/repositories") {
      return Response.json({
        repositories: [...state.repositories.values()]
          .filter((r) => mine(r.fullName))
          .map((r) => ({
            id: r.id,
            full_name: r.fullName,
            owner: { login: r.fullName.split("/")[0] },
            private: r.private,
            default_branch: r.defaultBranch,
          })),
      });
    }
    if ((m = /^\/orgs\/([^/]+)\/repos$/.exec(route)) && request.method === "POST") {
      const input = await body();
      const fullName = `${m[1]}/${String(input.name)}`;
      if (state.repositories.has(fullName.toLowerCase())) {
        return Response.json({ message: "name already exists on this account" }, { status: 422 });
      }
      const repo = addRepository(fullName, input.auto_init ? { "README.md": "# readme" } : {});
      repo.private = input.private === true;
      repo.commits.push({ sha: sha(), message: "Initial commit", files: { ...repo.files } });
      return Response.json(
        {
          id: repo.id,
          full_name: repo.fullName,
          owner: { login: m[1] },
          private: repo.private,
          default_branch: repo.defaultBranch,
        },
        { status: 201 },
      );
    }
    m = /^\/repos\/([^/]+\/[^/]+)\/(.+)$/.exec(route);
    if (!m) return Response.json({ message: "Not Found" }, { status: 404 });
    const repo = state.repositories.get(decodeURIComponent(m[1]!).toLowerCase());
    if (!repo || !mine(repo.fullName)) {
      return Response.json({ message: "Not Found" }, { status: 404 });
    }
    const rest = m[2]!;
    if (rest.startsWith("contents/")) {
      const file = rest.slice("contents/".length);
      return file in repo.files
        ? Response.json({ path: file, type: "file" })
        : Response.json({ message: "Not Found" }, { status: 404 });
    }
    const head = () => repo.commits.at(-1)!.sha;
    if (rest === `git/ref/heads/${repo.defaultBranch}`) {
      return Response.json({ object: { sha: head() } });
    }
    if ((m = /^git\/commits\/([0-9a-f]+)$/.exec(rest))) {
      return Response.json({ sha: m[1], tree: { sha: `tree-${m[1]}` } });
    }
    if (rest === "git/trees" && request.method === "POST") {
      const input = await body();
      const tree = input.tree as { path: string; content: string }[];
      const id = `tree-${sha()}`;
      pending.set(id, Object.fromEntries(tree.map((t) => [t.path, t.content])));
      return Response.json({ sha: id }, { status: 201 });
    }
    if (rest === "git/commits" && request.method === "POST") {
      const input = await body();
      const commit = sha();
      commits.set(commit, {
        message: String(input.message),
        files: pending.get(String(input.tree)) ?? {},
      });
      return Response.json({ sha: commit }, { status: 201 });
    }
    if (rest === `git/refs/heads/${repo.defaultBranch}` && request.method === "PATCH") {
      const input = await body();
      const made = commits.get(String(input.sha))!;
      Object.assign(repo.files, made.files);
      repo.commits.push({ sha: String(input.sha), ...made });
      return Response.json({ object: { sha: input.sha } });
    }
    if (rest === "actions/runs") {
      if (!state.actionsAllowed) {
        return Response.json(
          { message: "Resource not accessible by integration" },
          { status: 403 },
        );
      }
      const branch = url.searchParams.get("branch");
      const limit = Number(url.searchParams.get("per_page") ?? 30);
      const runs = (state.runs.get(repo.fullName.toLowerCase()) ?? [])
        .filter((r) => !branch || r.head_branch === branch)
        .slice(0, limit);
      return Response.json({ total_count: runs.length, workflow_runs: runs });
    }
    if ((m = /^statuses\/([0-9a-f]+)$/.exec(rest)) && request.method === "POST") {
      state.statuses.push({ repo: repo.fullName, sha: m[1]!, body: await body() });
      return Response.json({ state: "success" }, { status: 201 });
    }
    return Response.json({ message: "Not Found" }, { status: 404 });
  }) as typeof fetch;
  const pending = new Map<string, Record<string, string>>();
  const commits = new Map<string, { message: string; files: Record<string, string> }>();

  /** Signs a webhook delivery as GitHub does, with the app's webhook secret. */
  const deliver = async (origin: string, event: string, payload: unknown, secret?: string) => {
    const text = JSON.stringify(payload);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret ?? state.webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text)),
    );
    const hex = [...signature].map((b) => b.toString(16).padStart(2, "0")).join("");
    return new Request(`${origin}/github/webhook`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-github-event": event,
        "x-hub-signature-256": `sha256=${hex}`,
      },
      body: text,
    });
  };

  return { fetch: fetcher, state, actionsToken, addRepository, addRelease, deliver, pem, appJwk };
}
