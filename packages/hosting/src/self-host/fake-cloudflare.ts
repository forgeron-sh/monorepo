// A simulated Cloudflare account for tests: the routes self-host calls, in memory. Databases are
// backed by whatever D1 the test hands over (Miniflare), so migrations run for real.
import type { D1Database } from "../migrate";

interface Version {
  id: string;
  body: {
    modules: { content_base64: string }[];
    bindings: Record<string, unknown>[];
    assets?: { jwt: string; config?: unknown };
  };
}

export class FakeCloudflare {
  readonly calls: string[] = [];
  readonly workers = new Map<string, { versions: Version[]; deployed?: string }>();
  readonly databases = new Map<string, { name: string; d1?: D1Database }>();
  readonly namespaces = new Map<string, string>();
  readonly buckets = new Set<string>();
  readonly dispatchNamespaces = new Set<string>();
  /** The version uploads as the client sent them, `inherit` bindings unresolved. */
  readonly uploads: Version["body"][] = [];
  /** The user Workers of dispatch namespaces, by `<namespace>/<script>`. */
  readonly scripts = new Map<
    string,
    {
      metadata: { bindings: Record<string, unknown>[] } & Record<string, unknown>;
      modules: Record<string, string>;
    }
  >();
  /** The files Cloudflare holds, by hash: an upload session only asks for those it lacks. */
  readonly storedAssets = new Map<string, string>();
  /** Upload sessions by jwt, with the hashes still to upload; `completions` are the finished ones. */
  private readonly sessions = new Map<string, { manifest: string[]; missing: Set<string> }>();
  private readonly completions = new Map<string, string[]>();
  private counter = 0;

  /** Gives each database the D1 behind it, by name, as it is created. */
  constructor(
    private readonly backing: (name: string) => D1Database | undefined = () => undefined,
  ) {}

  readonly fetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const path = url.pathname.replace(/^\/client\/v4\/accounts\/[^/]+/, "");
    const body =
      init?.body instanceof FormData
        ? await this.parts(init.body)
        : init?.body
          ? (JSON.parse(String(init.body)) as Record<string, unknown>)
          : undefined;
    this.calls.push(`${method} ${path}`);
    try {
      const authorization = new Headers(init?.headers).get("authorization") ?? "";
      return this.ok(await this.route(method, path, url.searchParams, body, authorization));
    } catch (error) {
      if (error instanceof Response) return error;
      return this.fail(400, String(error));
    }
  };

  /** A multipart upload: the `metadata` part as JSON, every other part as the text of a module. */
  private async parts(form: FormData): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = { modules: {} };
    for (const [name, value] of form.entries()) {
      const text = typeof value === "string" ? value : await value.text();
      if (name === "metadata") out.metadata = JSON.parse(text);
      else (out.modules as Record<string, string>)[name] = text;
    }
    return out;
  }

  private ok(result: unknown) {
    return Response.json({ success: true, errors: [], result });
  }
  private fail(status: number, message: string) {
    return Response.json({ success: false, errors: [{ message }], result: null }, { status });
  }
  private id = (prefix: string) => `${prefix}-${++this.counter}`;

  private async route(
    method: string,
    path: string,
    query: URLSearchParams,
    body: Record<string, unknown> | undefined,
    authorization = "",
  ): Promise<unknown> {
    let m: RegExpMatchArray | null;
    // The Direct Upload of static assets (the console of the gateway).
    if (
      (m = path.match(/^\/workers\/scripts\/([^/]+)\/assets-upload-session$/)) &&
      method === "POST"
    ) {
      const manifest = body?.manifest as Record<string, { hash: string; size: number }>;
      const hashes = Object.values(manifest ?? {}).map((f) => f.hash);
      const missing = new Set(hashes.filter((h) => !this.storedAssets.has(h)));
      const jwt = this.id("session");
      this.sessions.set(jwt, { manifest: hashes, missing });
      // Nothing to upload: the session token completes the upload.
      if (!missing.size) this.completions.set(jwt, hashes);
      return { jwt, buckets: missing.size ? [[...missing]] : [] };
    }
    if (method === "POST" && path === "/workers/assets/upload") {
      // Authorised with the session jwt, not with the API token.
      const session = this.sessions.get(authorization.replace(/^Bearer /, ""));
      if (!session) throw this.fail(401, "the upload needs the jwt of an assets upload session");
      for (const [hash, content] of Object.entries(body?.modules as Record<string, string>)) {
        if (!session.missing.has(hash)) throw this.fail(400, `unexpected file ${hash}`);
        this.storedAssets.set(hash, content);
        session.missing.delete(hash);
      }
      if (session.missing.size) return {};
      const jwt = this.id("completion");
      this.completions.set(jwt, session.manifest);
      return { jwt };
    }
    if (method === "GET" && path === "/d1/database") {
      const name = query.get("name");
      return [...this.databases]
        .filter(([, d]) => !name || d.name === name)
        .map(([uuid, d]) => ({ uuid, name: d.name }));
    }
    if (method === "POST" && path === "/d1/database") {
      const name = String(body?.name);
      const uuid = this.id("db");
      const d1 = this.backing(name);
      this.databases.set(uuid, { name, ...(d1 ? { d1 } : {}) });
      return { uuid, name };
    }
    if ((m = path.match(/^\/d1\/database\/([^/]+)\/query$/)) && method === "POST") {
      const d1 = this.databases.get(m[1]!)?.d1;
      if (!d1) throw this.fail(404, "no such database");
      const run = (q: { sql: string; params?: unknown[] }) =>
        d1.prepare(q.sql).bind(...(q.params ?? []));
      if (Array.isArray(body?.batch)) {
        const out = await d1.batch((body.batch as { sql: string; params?: unknown[] }[]).map(run));
        return (out as { results?: unknown[] }[]).map((r) => ({ results: r.results ?? [] }));
      }
      return [{ results: (await run(body as { sql: string }).all()).results ?? [] }];
    }
    if ((m = path.match(/^\/d1\/database\/([^/]+)$/)) && method === "DELETE") {
      this.databases.delete(m[1]!);
      return {};
    }
    if (method === "GET" && path === "/storage/kv/namespaces") {
      return [...this.namespaces].map(([id, title]) => ({ id, title }));
    }
    if (method === "POST" && path === "/storage/kv/namespaces") {
      const id = this.id("kv");
      this.namespaces.set(id, String(body?.title));
      return { id, title: body?.title };
    }
    if ((m = path.match(/^\/storage\/kv\/namespaces\/([^/]+)$/)) && method === "DELETE") {
      this.namespaces.delete(m[1]!);
      return {};
    }
    if (method === "GET" && path === "/r2/buckets")
      return { buckets: [...this.buckets].map((name) => ({ name })) };
    if (method === "POST" && path === "/r2/buckets") {
      this.buckets.add(String(body?.name));
      return { name: body?.name };
    }
    if ((m = path.match(/^\/r2\/buckets\/([^/]+)$/)) && method === "DELETE") {
      this.buckets.delete(m[1]!);
      return {};
    }
    if (method === "POST" && path === "/workers/workers") {
      this.workers.set(String(body?.name), { versions: [] });
      return { id: this.id("worker"), name: body?.name };
    }
    if ((m = path.match(/^\/workers\/workers\/([^/]+)$/))) {
      const name = m[1]!;
      if (!this.workers.has(name)) throw this.fail(404, "no such worker");
      if (method === "DELETE") this.workers.delete(name);
      return { id: name, name };
    }
    if ((m = path.match(/^\/workers\/workers\/([^/]+)\/versions$/)) && method === "POST") {
      const worker = this.workers.get(m[1]!);
      if (!worker) throw this.fail(404, "no such worker");
      const upload = body as Version["body"] & { keep_assets?: boolean };
      // The real API: a version never inherits assets, it attaches the ones an upload completed.
      if (upload.keep_assets !== undefined) {
        throw this.fail(
          400,
          "Assets cannot be inherited between versions using keep_assets. Provide an explicit assets upload to attach assets to the new version instead.",
        );
      }
      const hadAssets = worker.versions.some((v) => v.body.assets);
      if (upload.assets && !this.completions.has(upload.assets.jwt)) {
        throw this.fail(400, "assets.jwt is not the completion token of an assets upload");
      }
      if (hadAssets && !upload.assets) {
        throw this.fail(400, "This Worker has assets: the new version must carry assets.jwt.");
      }
      const id = this.id("version");
      // `inherit` copies a binding, secret value included, from the most recently uploaded version
      // (Cloudflare docs: that is not always the deployed one); one that cannot be resolved is error 10057.
      const previous = worker.versions.at(-1);
      const bindings = (upload.bindings ?? []).map((binding) => {
        if (binding.type !== "inherit") return binding;
        const copied = previous?.body.bindings.find((b) => b.name === binding.name);
        if (!copied) {
          throw this.fail(400, `10057: cannot inherit the binding ${String(binding.name)}`);
        }
        return copied;
      });
      worker.versions.push({ id, body: { ...upload, bindings } });
      this.uploads.push(upload);
      return { id };
    }
    if ((m = path.match(/^\/workers\/scripts\/([^/]+)\/deployments$/)) && method === "POST") {
      const worker = this.workers.get(m[1]!);
      const versions = body?.versions as { version_id: string }[];
      if (!worker?.versions.some((v) => v.id === versions[0]?.version_id))
        throw this.fail(400, "unknown version");
      worker.deployed = versions[0]!.version_id;
      return { id: this.id("deployment") };
    }
    if (method === "POST" && path === "/workers/dispatch/namespaces") {
      this.dispatchNamespaces.add(String(body?.name));
      return { namespace_name: body?.name };
    }
    if ((m = path.match(/^\/workers\/dispatch\/namespaces\/([^/]+)$/)) && method === "GET") {
      if (!this.dispatchNamespaces.has(decodeURIComponent(m[1]!))) {
        throw this.fail(404, "no such namespace");
      }
      return { namespace_name: decodeURIComponent(m[1]!) };
    }
    if ((m = path.match(/^\/workers\/dispatch\/namespaces\/([^/]+)\/scripts\/([^/]+)$/))) {
      const key = `${decodeURIComponent(m[1]!)}/${decodeURIComponent(m[2]!)}`;
      if (method === "PUT") {
        const upload = body as unknown as {
          metadata?: { main_module?: string; bindings?: Record<string, unknown>[] };
          modules: Record<string, string>;
        };
        if (!upload.metadata?.main_module || !(upload.metadata.main_module in upload.modules)) {
          throw this.fail(400, "the metadata part must name a main_module that is uploaded");
        }
        this.scripts.set(key, {
          metadata: { bindings: [], ...upload.metadata },
          modules: upload.modules,
        });
        return { id: key };
      }
      if (method === "DELETE") {
        if (!this.scripts.delete(key)) throw this.fail(404, "no such script");
        return {};
      }
    }
    throw this.fail(404, `no route ${method} ${path}`);
  }
}
