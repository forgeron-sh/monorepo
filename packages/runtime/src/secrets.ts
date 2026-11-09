import type { SetupCandidate } from "./engine";
import type { Manifest, User, UserSecretStore, UserSetupStore } from "./types";

/** The answer of a tool's setup check: what the page needs of it. */
export type SetupCheckResult =
  | { ok: true }
  | { ok: false; message: string; errors: Record<string, string> };

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

/**
 * What a person still has to give a tool before it works (D-097): the required plain fields with no
 * value and the declared secrets that are not set. Empty when the setup is complete.
 */
export function missingSetup(
  manifest: Manifest,
  given: { setup: Readonly<Record<string, string>>; secrets: Readonly<Record<string, unknown>> },
): { fields: string[]; secrets: string[] } {
  return {
    fields: Object.entries(manifest.setup?.fields ?? {})
      .filter(([name, field]) => field.required && !given.setup[name])
      .map(([name]) => name),
    secrets: Object.keys(manifest.resources.userSecrets ?? {}).filter(
      (name) => !given.secrets[name],
    ),
  };
}

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
  extras: {
    /** Where the plain values live; without it the page asks for secrets only. */
    setupStore?: UserSetupStore;
    /**
     * Where to send the person once they are done, a path of the host that the host has already
     * checked (the OAuth step that sent them here, D-098). The page offers it as a link, and the form
     * keeps it.
     */
    next?: string;
    /**
     * Asks the tool whether the values the person is about to give are good (D-101). Nothing is kept
     * when it says no. Without it every valid value is kept.
     */
    check?: (candidate: SetupCandidate) => Promise<SetupCheckResult>;
  } = {},
): Promise<Response> {
  const { setupStore, next, check } = extras;
  const declared = Object.entries(manifest.resources.userSecrets ?? {});
  const fields = setupStore ? Object.entries(manifest.setup?.fields ?? {}) : [];
  const page = `${baseUrl.replace(/\/+$/, "")}/${fields.length > 0 ? "setup" : "secrets"}`;
  const action = next ? `${page}?next=${encodeURIComponent(next)}` : page;
  const heading = fields.length > 0 ? "Your setup" : "Your secrets";
  const eyebrow = manifest.title ?? manifest.name;

  const form = async (
    errors: Record<string, string> = {},
    sent: Record<string, string> = {},
    message?: string,
  ) => {
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
        return `<div class="secret"><label for="secret-${i}">${escapeHtml(secret.label)}${set ? ` <span class="tag-set">Set</span>` : ""}</label><input id="secret-${i}" type="password" name="${escapeHtml(name)}" autocomplete="off" spellcheck="false" placeholder="${set ? "Enter a new value to replace it" : ""}"><span class="hint">${escapeHtml(help)}</span>${errors[name] ? `<span class="hint" role="alert">${escapeHtml(errors[name])}</span>` : ""}</div>`;
      })
      .join("");
    const lead =
      fields.length > 0 && declared.length > 0
        ? "Only you can use these values. A secret is never shown again: leave its field empty to keep what is set."
        : fields.length > 0
          ? "These values are shown to you and to the workspace's administrators."
          : "Only you can use these values, and a value is never shown again. Leave a field empty to keep what is set.";
    const refused = message
      ? `<p class="notice warning" role="alert"><span class="tag">Not saved</span><span>${escapeHtml(message)}</span></p>`
      : "";
    return plain || secrets
      ? `${refused}<p class="lead">${lead}</p><form method="post" action="${escapeHtml(action)}" class="stack">${plain}${secrets}<button type="submit" class="btn primary">${fields.length > 0 ? "Save" : "Save secrets"}</button></form>`
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

  // The tool's own check, on what would be kept: the values given now over the ones already kept. It
  // says no for a reason the person can act on (an Odoo key that Odoo refuses), and nothing is kept.
  const submittedSecrets = Object.entries(sent).filter(
    (e): e is [string, string] => secretNames.has(e[0]) && typeof e[1] === "string" && e[1] !== "",
  );
  if (check && (Object.keys(values).length > 0 || submittedSecrets.length > 0)) {
    const verdict = await check({
      setup: { ...current, ...values },
      secrets: { ...(await store.read(user)), ...Object.fromEntries(submittedSecrets) },
    });
    if (!verdict.ok) {
      if (asJson) {
        return Response.json(
          { error: { code: "INVALID", message: verdict.message, fields: verdict.errors } },
          { status: 400 },
        );
      }
      // The secrets are not sent back to the browser: only the plain values are put in the form again.
      const strings = Object.fromEntries(
        Object.entries(sent).filter(
          (e): e is [string, string] => typeof e[1] === "string" && !secretNames.has(e[0]),
        ),
      );
      return render({
        title: heading,
        eyebrow,
        body: await form(verdict.errors, strings, verdict.message),
        status: 400,
      });
    }
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
  const carryOn = next
    ? `<p><a class="btn primary" href="${escapeHtml(next)}">Continue</a></p>`
    : "";
  const count = saved.length === 1 ? `1 ${noun}` : `${saved.length} ${noun}s`;
  return render({
    title: fields.length > 0 ? "Setup saved" : "Secrets saved",
    eyebrow,
    body: `<p class="notice success" role="status"><span class="tag">Done</span><span>${saved.length === 0 ? "Nothing was changed: every field was empty." : `${count} saved.`} You can go back to your work.</span></p>${carryOn}`,
    status: 200,
  });
}
