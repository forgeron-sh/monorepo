import type { Person } from "../kernel/person";
import { button, escape, facts, hiddenFields, notice, page, paragraph } from "./shell";

// `forgeron login` in the browser (D-031, D-053): a confirmation, then a hand-back page.

export interface AuthorizationInput {
  workspace: string;
  person: Person;
  /** The loopback address the CLI listens on, `127.0.0.1:<port>`. */
  address: string;
  tokenDays: number;
  /** The CLI's request, posted back unchanged by both buttons. */
  fields: Record<string, string>;
}

export function authorizationPage(input: AuthorizationInput): Response {
  const who = input.person.email;
  return page(
    {
      title: `Authorize the forgeron CLI on ${input.address}?`,
      eyebrow: "Command line",
      workspace: input.workspace,
    },
    `<p class="lead">A program on your computer started <code>forgeron login</code> and is waiting at this address. Authorize it only if you ran that command just now.</p>` +
      facts([
        ["Signed in as", who],
        ["Workspace", input.workspace],
        ["Waiting at", input.address],
        ["Token lasts", `${input.tokenDays} days`],
      ]) +
      `<form method="post" action="/auth/cli">${hiddenFields(input.fields)}` +
      `<div class="actions">${button("Cancel", { name: "decision", value: "deny" })}${button("Authorize", { variant: "primary", name: "decision", value: "allow" })}</div></form>`,
  );
}

/**
 * The page that follows the answer. It sends the browser to the CLI by a refresh and a link, since
 * a redirect after the form post would run into `form-action`.
 */
export function handBackPage(input: { workspace: string; to: string; allowed: boolean }): Response {
  const link = escape(input.to);
  return page(
    {
      title: input.allowed ? "CLI authorized" : "Authorization cancelled",
      eyebrow: "Command line",
      workspace: input.workspace,
      head: `<meta http-equiv="refresh" content="0;url=${link}">`,
    },
    (input.allowed
      ? notice("success", "The forgeron CLI is authorized. Return to your terminal.")
      : notice("warning", "Nothing was shared. The CLI was told you cancelled.")) +
      paragraph("If your terminal did not move on, send the answer to the CLI yourself:", "lead") +
      `<a class="btn${input.allowed ? " primary" : ""}" href="${link}">Continue to the CLI</a>`,
  );
}
