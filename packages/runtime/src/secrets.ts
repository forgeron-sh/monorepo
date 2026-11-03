import type { Manifest, User, UserSecretStore } from "./types";

// `/secrets`: where a person enters their own secrets (`resources.userSecrets`, sdk.md §10), the
// link every interface points to when one is missing (`SECRET_REQUIRED`, 428).
//   GET  /secrets   a page with one field per secret the tool declares
//   POST /secrets   a form, or JSON `{ "NAME": "value" }`: stores what the signed-in person sent
// Values go in and are never shown again: this route has no way to read one back. A value is
// stored for the caller only, and only for a name the tool declared.

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** A page of the secrets flow, for a host to dress (the gateway puts it in its page shell). */
export interface SecretsPage {
  title: string;
  /** Small line above the heading: the tool's name. */
  eyebrow: string;
  /** Markup built with the classes of the gateway's shell; every dynamic value is escaped. */
  body: string;
  status: number;
}

/** Turns a page into a response. The default is a bare document: a tool served without a gateway. */
export type SecretsRenderer = (page: SecretsPage) => Response;

const bare: SecretsRenderer = ({ title, eyebrow, body, status }) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><p>${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1>${body}`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-security-policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
      },
    },
  );

export async function handleSecretsInput(
  request: Request,
  manifest: Manifest,
  user: User,
  store: UserSecretStore,
  baseUrl: string,
  render: SecretsRenderer = bare,
): Promise<Response> {
  const declared = Object.entries(manifest.resources.userSecrets ?? {});
  const action = `${baseUrl.replace(/\/+$/, "")}/secrets`;

  if (request.method === "GET") {
    const own = await store.read(user);
    const fields = declared
      .map(([name, secret], i) => {
        const set = Boolean(own[name]);
        const help = [secret.help, secret.why].filter(Boolean).join(" ");
        return `<div class="secret"><label for="secret-${i}">${escapeHtml(secret.label)}${set ? ` <span class="tag-set">Set</span>` : ""}</label><input id="secret-${i}" type="password" name="${escapeHtml(name)}" autocomplete="off" spellcheck="false" placeholder="${set ? "Enter a new value to replace it" : ""}"><span class="hint">${escapeHtml(help)}</span></div>`;
      })
      .join("");
    const body = fields
      ? `<p class="lead">Only you can use these values, and a value is never shown again. Leave a field empty to keep what is set.</p><form method="post" action="${escapeHtml(action)}" class="stack">${fields}<button type="submit" class="btn primary">Save secrets</button></form>`
      : `<p>This tool asks for no personal secret.</p>`;
    return render({
      title: "Your secrets",
      eyebrow: manifest.title ?? manifest.name,
      body,
      status: 200,
    });
  }
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "GET, POST" } });
  }
  // A form posted from another site must not set a person's secrets.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Cross-site requests are refused." } },
      { status: 403 },
    );
  }

  let sent: Record<string, unknown>;
  try {
    sent = request.headers.get("content-type")?.includes("application/json")
      ? ((await request.json()) as Record<string, unknown>)
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return Response.json(
      { error: { code: "INVALID", message: "The body is not a form or JSON." } },
      { status: 400 },
    );
  }

  const names = new Set(declared.map(([name]) => name));
  const unknown = Object.keys(sent).filter((name) => !names.has(name));
  if (unknown.length > 0) {
    return Response.json(
      { error: { code: "INVALID", message: `Unknown secret: ${unknown.join(", ")}.` } },
      { status: 400 },
    );
  }
  const saved: string[] = [];
  for (const [name, value] of Object.entries(sent)) {
    if (typeof value !== "string" || value === "") continue;
    await store.write(user, name, value);
    saved.push(name);
  }
  if (request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ saved });
  }
  const count = saved.length === 1 ? "1 secret" : `${saved.length} secrets`;
  return render({
    title: "Secrets saved",
    eyebrow: manifest.title ?? manifest.name,
    body: `<p class="notice success" role="status"><span class="tag">Done</span><span>${saved.length === 0 ? "Nothing was changed: every field was empty." : `${count} saved.`} You can go back to your work.</span></p>`,
    status: 200,
  });
}
