// `POST /github/webhook` (D-123): what GitHub tells a workspace's app. Each delivery is signed with
// the app's webhook secret (`X-Hub-Signature-256`, HMAC-SHA256 of the body); anything else is refused
// before it is read. A deleted branch closes its preview; an installation added or removed on GitHub
// is recorded. Other events are acknowledged and ignored.
import { closePreview, type Registry } from "@forgeron/registry";
import type { Hosting } from "@forgeron/hosting";

const encoder = new TextEncoder();
const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });
const fail = (status: number, code: string, message: string) =>
  json(status, { error: { code, message } });

/** Whether `signature` (`sha256=<hex>`) is the HMAC-SHA256 of `body` under `secret`, in constant time. */
async function validSignature(
  secret: string,
  body: Uint8Array,
  signature: string | null,
): Promise<boolean> {
  const hex = /^sha256=([0-9a-f]{64})$/i.exec(signature ?? "")?.[1];
  if (!hex) return false;
  const expected = Uint8Array.from(hex.match(/../g)!, (b) => parseInt(b, 16));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify("HMAC", key, expected, body);
}

export interface WebhookContext {
  workspace: string;
  registry: Registry;
  /** The workspace's hosting, to close a preview; `undefined` where the gateway cannot deploy. */
  hosting: Hosting | undefined;
}

type Payload = {
  action?: string;
  ref?: string;
  ref_type?: string;
  repository?: { id?: number; full_name?: string };
  installation?: { id?: number; account?: { login?: string; type?: string } };
};

export async function handleGithubWebhook(
  request: Request,
  context: WebhookContext,
): Promise<Response> {
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
  const { registry, workspace } = context;
  const app = await registry.githubApp(workspace);
  if (!app) return fail(404, "NOT_FOUND", "This workspace has no GitHub App.");
  const body = new Uint8Array(await request.arrayBuffer());
  const { webhookSecret } = await registry.githubAppKeys(workspace);
  if (!(await validSignature(webhookSecret, body, request.headers.get("x-hub-signature-256")))) {
    return fail(401, "UNAUTHENTICATED", "The delivery is not signed by this workspace's app.");
  }
  let payload: Payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(body)) as Payload;
  } catch {
    return fail(400, "INVALID", "The body is not JSON.");
  }
  const event = request.headers.get("x-github-event");

  if (event === "ping") return json(200, { ok: true });

  if (event === "installation") {
    const id = payload.installation?.id;
    const account = payload.installation?.account;
    if (typeof id !== "number") return fail(400, "INVALID", "installation: no id.");
    if (payload.action === "deleted") {
      await registry.removeGithubInstallation(workspace, id);
      return json(200, { installation: id, removed: true });
    }
    if (payload.action === "created" && account?.login) {
      await registry.addGithubInstallation({
        workspace,
        installationId: id,
        account: account.login,
        accountType: account.type === "User" ? "User" : "Organization",
      });
      return json(200, { installation: id, added: true });
    }
    return json(202, { ignored: `installation.${payload.action ?? ""}` });
  }

  if (event === "delete" && payload.ref_type === "branch") {
    const repo = payload.repository?.full_name;
    const branch = payload.ref;
    if (!repo || !branch) return fail(400, "INVALID", "delete: no repository or branch.");
    const tool = await registry.toolByRepository(workspace, {
      repo,
      ...(typeof payload.repository?.id === "number" ? { repoId: payload.repository.id } : {}),
    });
    if (!tool)
      return json(202, { ignored: "No tool of this workspace comes from this repository." });
    if (!context.hosting) return fail(501, "NOT_CONFIGURED", "This gateway cannot deploy.");
    await closePreview(registry, context.hosting, tool, branch);
    return json(200, { tool: tool.name, branch, removed: true });
  }

  return json(202, { ignored: event ?? "" });
}
