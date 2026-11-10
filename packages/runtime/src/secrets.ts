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

/** One of a person's saved secrets, without its value (D-105). */
export interface SavedSecret {
  id: string;
  label: string;
  kind?: string;
  /** Where it is used, so that the person knows what changing it touches. */
  usedBy: Array<{ tool: string; field: string }>;
}

/**
 * What the page needs of the person's registry of secrets: to offer the saved ones, to read one of the
 * person's own for the tool's check, and to bind one to a field. The page never shows a value.
 */
export interface SavedSecrets {
  list(): Promise<SavedSecret[]>;
  /** The latest value of the person's own secret, or `undefined` if it is not theirs. */
  value(id: string): Promise<string | undefined>;
  bind(field: string, id: string): Promise<void>;
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

/** A delegated connector as a step of the setup page. */
export interface ConnectorStep {
  label: string;
  why: string;
  connected: boolean;
  /** Where the person gives their consent. */
  url: string;
}

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
    /** The person's saved secrets: offered at each secret field, chosen by a click, never by field name. */
    saved?: SavedSecrets;
    /**
     * The tool's delegated connectors, as steps of this page (D-111): each says whether the person has
     * consented and links to where they give it. The host decides what is listed.
     */
    connectors?: ConnectorStep[];
    /** Where the person manages all their secrets (`/my/secrets`): shown as a link under the form. */
    mySecrets?: string;
  } = {},
): Promise<Response> {
  const { setupStore, next, check, saved: registry, connectors = [], mySecrets } = extras;
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
    const offered = registry ? await registry.list() : [];
    const secrets = declared
      .map(([name, secret], i) => {
        const set = Boolean(own[name]);
        const help = [secret.help, secret.why].filter(Boolean).join(" ");
        // Saved secrets this field is not already using: the same kind first, then the person's others.
        const usable = offered.filter(
          (o) => !o.usedBy.some((u) => u.tool === manifest.name && u.field === name),
        );
        const same = usable.filter((o) => secret.kind !== undefined && o.kind === secret.kind);
        const others = usable.filter((o) => !same.includes(o));
        const option = (o: SavedSecret) => {
          const where = o.usedBy.length
            ? ` (used by ${[...new Set(o.usedBy.map((u) => u.tool))].join(", ")})`
            : "";
          return `<option value="${escapeHtml(o.id)}">${escapeHtml(o.label)}${escapeHtml(where)}</option>`;
        };
        const group = (title: string, list: SavedSecret[]) =>
          list.length
            ? `<optgroup label="${escapeHtml(title)}">${list.map(option).join("")}</optgroup>`
            : "";
        const choose =
          same.length + others.length > 0
            ? `<label for="use-${i}" class="hint">Or use a secret you saved before</label><select id="use-${i}" name="use:${escapeHtml(name)}"><option value="">Enter a new one</option>${group("Same kind", same)}${group("Your other saved secrets", others)}</select>`
            : "";
        const error = errors[name]
          ? `<span class="hint" role="alert">${escapeHtml(errors[name])}</span>`
          : "";
        return `<div class="secret"><label for="secret-${i}">${escapeHtml(secret.label)}${set ? ` <span class="tag-set">Set</span>` : ""}</label><input id="secret-${i}" type="password" name="${escapeHtml(name)}" autocomplete="off" spellcheck="false" placeholder="${set ? "Enter a new value to replace it" : ""}"><span class="hint">${escapeHtml(help)}</span>${choose}${error}</div>`;
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
    // Delegated connectors are steps of the same page: connected, or a link to connect (D-111).
    const steps = connectors.length
      ? `<section class="stack"><h2>Connections</h2>${connectors
          .map(
            (c) =>
              `<p><strong>${escapeHtml(c.label)}</strong> ${
                c.connected
                  ? `<span class="tag-set">Connected</span>`
                  : `<a class="btn primary" href="${escapeHtml(c.url)}">Connect</a>`
              }<span class="hint">${escapeHtml(c.why)}</span></p>`,
          )
          .join("")}</section>`
      : "";
    const manage = mySecrets
      ? `<p class="hint">To see and change all your secrets, and which tool uses which: <a href="${escapeHtml(mySecrets)}">your secrets</a>.</p>`
      : "";
    return plain || secrets
      ? `${refused}<p class="lead">${lead}</p><form method="post" action="${escapeHtml(action)}" class="stack">${plain}${secrets}<button type="submit" class="btn primary">${fields.length > 0 ? "Save" : "Save secrets"}</button></form>${steps}${manage}`
      : steps
        ? `${steps}${manage}`
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
  // `use:NAME` chooses a saved secret for the secret field NAME.
  const unknown = Object.keys(sent).filter(
    (name) =>
      !secretNames.has(name) &&
      !fieldOf.has(name) &&
      !(name.startsWith("use:") && secretNames.has(name.slice(4))),
  );
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

  // A saved secret chosen for a secret field: it must be the person's own, and not typed over (D-105).
  // Its value joins what the tool's check sees; nothing is bound before the check says yes.
  const chosen: Array<[string, string]> = [];
  const chosenValues: Record<string, string> = {};
  for (const name of secretNames) {
    const id = sent[`use:${name}`];
    if (typeof id !== "string" || id === "") continue;
    if (typeof sent[name] === "string" && sent[name] !== "") {
      errors[name] = "Choose a saved secret or enter a new one, not both.";
      continue;
    }
    const value = registry ? await registry.value(id) : undefined;
    if (value === undefined) {
      errors[name] = "That saved secret is not available.";
      continue;
    }
    chosen.push([name, id]);
    chosenValues[name] = value;
  }
  if (Object.keys(errors).length > 0) {
    if (asJson) {
      return Response.json(
        { error: { code: "INVALID", message: "Some values are not valid.", fields: errors } },
        { status: 400 },
      );
    }
    const strings = Object.fromEntries(
      Object.entries(sent).filter(
        (e): e is [string, string] => typeof e[1] === "string" && !secretNames.has(e[0]),
      ),
    );
    return render({ title: heading, eyebrow, body: await form(errors, strings), status: 400 });
  }

  // The tool's own check, on what would be kept: the values given now over the ones already kept. It
  // says no for a reason the person can act on (an Odoo key that Odoo refuses), and nothing is kept.
  const submittedSecrets = Object.entries(sent).filter(
    (e): e is [string, string] => secretNames.has(e[0]) && typeof e[1] === "string" && e[1] !== "",
  );
  if (
    check &&
    (Object.keys(values).length > 0 || submittedSecrets.length > 0 || chosen.length > 0)
  ) {
    const verdict = await check({
      setup: { ...current, ...values },
      secrets: {
        ...(await store.read(user)),
        ...chosenValues,
        ...Object.fromEntries(submittedSecrets),
      },
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
  for (const [name, id] of chosen) {
    await registry!.bind(name, id);
    saved.push(name);
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
