import type { Person } from "../kernel/person";
import { button, escape, hiddenFields, notice, page, paragraph } from "./shell";

// A person's own secrets (D-106): what they gave the workspace's tools, which tool uses which, and the
// one place to change a key. A value is never shown, not even to its owner: to change one, give a new one.

interface SecretView {
  id: string;
  label: string;
  kind?: string;
  versions: number;
  history: Array<{ version: number; createdAt: string; via: string; byPerson: boolean }>;
  usedBy: Array<{ tool: string; field: string; scope: string; pin?: number }>;
}

export interface MySecretsInput {
  workspace: string;
  person: Person;
  secrets: SecretView[];
  /** What just happened, from a fixed list of messages. */
  done?: string;
  /** What went wrong, in words the person can act on. */
  error?: string;
  status?: number;
}

const DONE: Record<string, string> = {
  created: "The secret is saved.",
  version: "The new value is saved. Every tool that follows the latest version uses it now.",
  renamed: "The secret is renamed.",
  deleted: "The secret is deleted. The tools that used it will ask for a new one.",
  bound: "The tool now uses that secret.",
  overridden: "The tool now uses that secret there, and the same one as before everywhere else.",
  unbound: "The tool no longer uses that secret.",
};

/** The messages a redirect may carry back to the page: only these. */
export const isDone = (key: string | null): key is string => key !== null && key in DONE;

const scopeWords = (scope: string): string =>
  scope === "*"
    ? "every environment"
    : scope === "production"
      ? "production"
      : scope === "preview"
        ? "every preview"
        : `the preview of ${scope.slice("preview:".length)}`;

const day = (iso: string): string => iso.slice(0, 10);

/** Who gave a version, in words: the person themselves, an administrator, or before versions were kept. */
const byWords = (h: SecretView["history"][number]): string =>
  h.via === "legacy"
    ? "before versions were kept"
    : h.via === "admin"
      ? "by an administrator"
      : "by you";

const form = (fields: Record<string, string>, inner: string): string =>
  `<form method="post" action="/my/secrets" class="stack">${hiddenFields(fields)}${inner}</form>`;

export function mySecretsPage(input: MySecretsInput): Response {
  const { secrets } = input;
  const choices = (current: string) =>
    secrets
      .map(
        (s) =>
          `<option value="${escape(s.id)}"${s.id === current ? " selected" : ""}>${escape(s.label)}</option>`,
      )
      .join("");

  const card = (s: SecretView, i: number): string => {
    const last = s.history[0];
    const bound = s.usedBy.length;
    const uses = bound
      ? s.usedBy
          .map((u, j) => {
            const id = `${i}-${j}`;
            const where = { tool: u.tool, field: u.field, scope: u.scope };
            const versions = s.history
              .map(
                (h) =>
                  `<option value="${h.version}"${u.pin === h.version ? " selected" : ""}>Version ${h.version}, ${escape(day(h.createdAt))}</option>`,
              )
              .join("");
            return (
              `<li><strong>${escape(u.tool)}</strong> <span class="mono">${escape(u.field)}</span>, ${escape(scopeWords(u.scope))}` +
              `, ${u.pin === undefined ? "always the latest version" : `kept on version ${u.pin}`}` +
              `<details><summary>Change</summary>` +
              form(
                { action: "bind", ...where },
                `<label for="secret-${id}">Use</label><select id="secret-${id}" name="secret">${choices(s.id)}</select>` +
                  `<label for="pin-${id}">Version</label><select id="pin-${id}" name="pin"><option value="">The latest</option>${versions}</select>` +
                  button("Save", { variant: "primary" }),
              ) +
              form({ action: "unbind", ...where }, button("Stop using it here")) +
              (u.scope === "*"
                ? `<p>Use another secret for a test environment or a branch, and this one everywhere else:</p>` +
                  form(
                    { action: "override", tool: u.tool, field: u.field },
                    `<label for="where-${id}">Where</label><select id="where-${id}" name="where"><option value="production">Production</option><option value="preview">Every preview</option><option value="branch">The preview of one branch</option></select>` +
                      `<label for="branch-${id}">Branch (for one branch)</label><input id="branch-${id}" type="text" name="branch" maxlength="60" autocomplete="off" spellcheck="false">` +
                      `<label for="other-${id}">Use</label><select id="other-${id}" name="secret">${choices(s.id)}</select>` +
                      button("Use it there", { variant: "primary" }),
                  )
                : "") +
              `</details></li>`
            );
          })
          .join("")
      : "";
    return (
      `<section class="stack"><h2>${escape(s.label)}</h2>` +
      `<dl class="facts"><div><dt>Kind</dt><dd>${escape(s.kind ?? "not set")}</dd></div>` +
      `<div><dt>Versions</dt><dd>${s.versions}</dd></div>` +
      `<div><dt>Last changed</dt><dd>${last ? `${escape(day(last.createdAt))}, ${escape(byWords(last))}` : "unknown"}</dd></div></dl>` +
      (bound
        ? `<p>Used by</p><ul>${uses}</ul>`
        : paragraph(
            "No tool uses it yet. A tool's setup page offers it when it asks for the same kind of secret.",
          )) +
      `<details><summary>Give a new value</summary>` +
      form(
        { action: "version", secret: s.id },
        `<label for="value-${i}">New value</label><input id="value-${i}" type="password" name="value" autocomplete="off" spellcheck="false" required>` +
          `<span class="hint">Every tool that follows the latest version uses it from now on, after its own check. The old value is kept as an earlier version.</span>` +
          button("Save a new version", { variant: "primary" }),
      ) +
      `</details>` +
      `<details><summary>Rename</summary>` +
      form(
        { action: "rename", secret: s.id },
        `<label for="label-${i}">Name</label><input id="label-${i}" type="text" name="label" value="${escape(s.label)}" maxlength="80" required>` +
          button("Save", { variant: "primary" }),
      ) +
      `</details>` +
      `<details><summary>Delete</summary>` +
      form(
        { action: "delete", secret: s.id },
        (bound
          ? `<label><input type="checkbox" name="confirm" value="yes" required> I understand that ${bound === 1 ? "the tool that uses it asks" : `the ${bound} places that use it ask`} for a new secret</label>`
          : "") + button("Delete this secret"),
      ) +
      `</details></section>`
    );
  };

  const intro =
    paragraph(
      "These are the secrets you gave this workspace's tools. A value is never shown, here or anywhere: to change one, give a new value. An administrator can help you set one, and you will see it here when they do.",
      "lead",
    ) +
    (secrets.length
      ? ""
      : paragraph("You have not saved a secret yet. A tool asks for one on its setup page."));

  const add =
    `<section class="stack"><h2>Save a new secret</h2>` +
    paragraph("For a tool that will ask for it later, or one you want ready.") +
    form(
      { action: "new" },
      `<label for="new-label">Name</label><input id="new-label" type="text" name="label" maxlength="80" required>` +
        `<label for="new-kind">Kind (optional)</label><input id="new-kind" type="text" name="kind" maxlength="60" placeholder="odoo.api-key" autocomplete="off">` +
        `<span class="hint">A kind lets a tool that asks for the same kind offer this secret first.</span>` +
        `<label for="new-value">Value</label><input id="new-value" type="password" name="value" autocomplete="off" spellcheck="false" required>` +
        button("Save", { variant: "primary" }),
    ) +
    `</section>`;

  return page(
    {
      title: "Your secrets",
      eyebrow: input.person.email,
      workspace: input.workspace,
      ...(input.status ? { status: input.status } : {}),
    },
    (input.done && DONE[input.done] ? notice("success", DONE[input.done]!) : "") +
      (input.error ? notice("danger", input.error) : "") +
      intro +
      secrets.map(card).join("") +
      add,
  );
}
