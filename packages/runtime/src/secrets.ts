import type { Manifest, User, UserSecretStore } from "./types";

// `/secrets`: where a person enters their own secrets (`resources.userSecrets`, sdk.md §10), the
// link every interface points to when one is missing (`SECRET_REQUIRED`, 428).
//   GET  /secrets   a page with one field per secret the tool declares
//   POST /secrets   a form, or JSON `{ "NAME": "value" }`: stores what the signed-in person sent
// Values go in and are never shown again: this route has no way to read one back. A value is
// stored for the caller only, and only for a name the tool declared.

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const page = (body: string, status = 200) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Your secrets</title>${body}`,
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
): Promise<Response> {
  const declared = Object.entries(manifest.resources.userSecrets ?? {});
  const action = `${baseUrl.replace(/\/+$/, "")}/secrets`;

  if (request.method === "GET") {
    const own = await store.read(user);
    const fields = declared
      .map(
        ([name, secret]) =>
          `<p><label>${escapeHtml(secret.label)}<br><input type="password" name="${escapeHtml(name)}" autocomplete="off" placeholder="${own[name] ? "set; enter a new value to replace it" : ""}"></label><br><small>${escapeHtml(secret.help ?? "")} ${escapeHtml(secret.why)}</small></p>`,
      )
      .join("");
    return page(
      `<h1>${escapeHtml(manifest.title ?? manifest.name)}: your secrets</h1><form method="post" action="${escapeHtml(action)}">${fields || "<p>This tool asks for no personal secret.</p>"}<button>Save</button></form>`,
    );
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
  return page(
    `<h1>Saved</h1><p>${saved.length} secret(s) saved. You can go back to your work.</p>`,
  );
}
