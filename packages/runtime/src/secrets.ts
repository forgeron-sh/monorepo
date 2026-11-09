import type { Manifest, User, UserSecretStore, UserSetupStore } from "./types";

// `/setup` and `/secrets`: where a person enters what a tool asks of them (`manifest.setup` and
// `resources.userSecrets`, sdk.md §10, D-036, D-097), the link every interface points to when
// something is missing (`SECRET_REQUIRED`, 428). The two paths are one page.
//   GET  a page with one field per plain value and per secret the tool declares
//   POST a form, or JSON `{ "name": "value" }`: stores what the signed-in person sent
// A secret goes in and is never shown again: this route has no way to read one back. A plain value
// is shown to its owner. Everything is stored for the caller only, and only for a name the tool
// declared.

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
  /** Where the plain values live; without it the page asks for secrets only. */
  setupStore?: UserSetupStore,
): Promise<Response> {
  const declared = Object.entries(manifest.resources.userSecrets ?? {});
  const fields = setupStore ? Object.entries(manifest.setup?.fields ?? {}) : [];
  const action = `${baseUrl.replace(/\/+$/, "")}/${fields.length > 0 ? "setup" : "secrets"}`;
  const heading = fields.length > 0 ? "Your setup" : "Your secrets";
  const eyebrow = manifest.title ?? manifest.name;

  const form = async (errors: Record<string, string> = {}, sent: Record<string, string> = {}) => {
    const own = await store.read(user);
    const values = setupStore ? await setupStore.read(user) : {};
    const plain = fields
      .map(([name, field], i) => {
        const value = sent[name] ?? values[name] ?? "";
        const help = field.help ? `<span class="hint">${escapeHtml(field.help)}</span>` : "";
        const error = errors[name]
          ? `<span class="hint" role="alert">${escapeHtml(errors[name])}</span>`
          : "";
        const required = field.required ? " required" : "";
        const label = `<label for="field-${i}">${escapeHtml(field.label)}${field.required ? "" : " (optional)"}</label>`;
        const input =
          field.type === "choice"
            ? `<select id="field-${i}" name="${escapeHtml(name)}"${required}><option value=""></option>${field.options
                .map(
                  (o) =>
                    `<option value="${escapeHtml(o)}"${o === value ? " selected" : ""}>${escapeHtml(o)}</option>`,
                )
                .join("")}</select>`
            : `<input id="field-${i}" type="text" name="${escapeHtml(name)}" value="${escapeHtml(value)}"${field.maxLength ? ` maxlength="${field.maxLength}"` : ""}${required}>`;
        return `<div class="secret">${label}${input}${help}${error}</div>`;
      })
      .join("");
    const secrets = declared
      .map(([name, secret], i) => {
        const set = Boolean(own[name]);
        const help = [secret.help, secret.why].filter(Boolean).join(" ");
        return `<div class="secret"><label for="secret-${i}">${escapeHtml(secret.label)}${set ? ` <span class="tag-set">Set</span>` : ""}</label><input id="secret-${i}" type="password" name="${escapeHtml(name)}" autocomplete="off" spellcheck="false" placeholder="${set ? "Enter a new value to replace it" : ""}"><span class="hint">${escapeHtml(help)}</span></div>`;
      })
      .join("");
    const lead =
      fields.length > 0 && declared.length > 0
        ? "Only you can use these values. A secret is never shown again: leave its field empty to keep what is set."
        : fields.length > 0
          ? "These values are shown to you and to the workspace's administrators."
          : "Only you can use these values, and a value is never shown again. Leave a field empty to keep what is set.";
    return plain || secrets
      ? `<p class="lead">${lead}</p><form method="post" action="${escapeHtml(action)}" class="stack">${plain}${secrets}<button type="submit" class="btn primary">${fields.length > 0 ? "Save" : "Save secrets"}</button></form>`
      : `<p>This tool asks for nothing from you.</p>`;
  };

  if (request.method === "GET") {
    return render({ title: heading, eyebrow, body: await form(), status: 200 });
  }
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "GET, POST" } });
  }
  // A form posted from another site must not set a person's values.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Cross-site requests are refused." } },
      { status: 403 },
    );
  }

  const asJson = request.headers.get("content-type")?.includes("application/json") ?? false;
  let sent: Record<string, unknown>;
  try {
    sent = asJson
      ? ((await request.json()) as Record<string, unknown>)
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return Response.json(
      { error: { code: "INVALID", message: "The body is not a form or JSON." } },
      { status: 400 },
    );
  }

  const secretNames = new Set(declared.map(([name]) => name));
  const fieldOf = new Map(fields);
  const unknown = Object.keys(sent).filter((name) => !secretNames.has(name) && !fieldOf.has(name));
  if (unknown.length > 0) {
    return Response.json(
      { error: { code: "INVALID", message: `Unknown field: ${unknown.join(", ")}.` } },
      { status: 400 },
    );
  }

  // Plain values are checked before anything is written: all of them or none.
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  const current = setupStore ? await setupStore.read(user) : {};
  for (const [name, field] of fields) {
    const raw = sent[name];
    const given = typeof raw === "string" ? raw.trim() : "";
    if (given === "") {
      // A form always sends every field: an empty one that is required and has no value is refused.
      if (!asJson && field.required && !current[name]) errors[name] = "This is required.";
      continue;
    }
    if (field.type === "choice" && !field.options.includes(given)) {
      errors[name] = `Choose one of: ${field.options.join(", ")}.`;
    } else if (field.type === "text" && given.length > (field.maxLength ?? 200)) {
      errors[name] = `At most ${field.maxLength ?? 200} characters.`;
    } else {
      values[name] = given;
    }
  }
  if (Object.keys(errors).length > 0) {
    if (asJson) {
      return Response.json(
        { error: { code: "INVALID", message: "Some values are not valid.", fields: errors } },
        { status: 400 },
      );
    }
    const strings = Object.fromEntries(
      Object.entries(sent).filter((e): e is [string, string] => typeof e[1] === "string"),
    );
    return render({ title: heading, eyebrow, body: await form(errors, strings), status: 400 });
  }

  const saved: string[] = [];
  if (setupStore && Object.keys(values).length > 0) {
    await setupStore.write(user, values);
    saved.push(...Object.keys(values));
  }
  for (const [name, value] of Object.entries(sent)) {
    if (!secretNames.has(name) || typeof value !== "string" || value === "") continue;
    await store.write(user, name, value);
    saved.push(name);
  }
  if (asJson) return Response.json({ saved });
  const noun = fields.length > 0 ? "value" : "secret";
  const count = saved.length === 1 ? `1 ${noun}` : `${saved.length} ${noun}s`;
  return render({
    title: fields.length > 0 ? "Setup saved" : "Secrets saved",
    eyebrow,
    body: `<p class="notice success" role="status"><span class="tag">Done</span><span>${saved.length === 0 ? "Nothing was changed: every field was empty." : `${count} saved.`} You can go back to your work.</span></p>`,
    status: 200,
  });
}
