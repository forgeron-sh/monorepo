import type { Person } from "../kernel/person";
import { button, escape, facts, hiddenFields, notice, page, paragraph } from "./shell";

// An MCP client (Claude, for one) asking to use the workspace's admin MCP as the signed-in person
// (D-094): a confirmation, then a hand-back page.

export interface ConsentInput {
  workspace: string;
  person: Person;
  /** What the client called itself when it registered. Anyone may pick any name: it is shown as a claim. */
  clientName: string;
  /** Where the answer goes: the host of the registered redirect address. */
  address: string;
  /** The client's request, posted back unchanged by both buttons. */
  fields: Record<string, string>;
}

export function consentPage(input: ConsentInput): Response {
  return page(
    {
      title: `Let "${input.clientName}" use ${input.workspace}?`,
      eyebrow: "Connect an app",
      workspace: input.workspace,
    },
    `<p class="lead">An app calling itself <strong>${escape(input.clientName)}</strong> asks to administer this workspace as you, through its MCP. Allow it only if you just asked an app to connect.</p>` +
      facts([
        ["Signed in as", input.person.email],
        ["Workspace", input.workspace],
        ["The answer goes to", input.address],
        ["It may", "Do what your role allows here, and no more"],
        ["Access lasts", "One hour, renewed until you revoke it or 30 days pass"],
      ]) +
      `<form method="post" action="/oauth/authorize">${hiddenFields(input.fields)}` +
      `<div class="actions">${button("Cancel", { name: "decision", value: "deny" })}${button("Allow", { variant: "primary", name: "decision", value: "allow" })}</div></form>`,
  );
}

/** The page that follows the answer: a refresh and a link, since a redirect after a form post meets `form-action`. */
export function connectionHandBackPage(input: {
  workspace: string;
  to: string;
  allowed: boolean;
}): Response {
  const link = escape(input.to);
  return page(
    {
      title: input.allowed ? "App connected" : "Connection cancelled",
      eyebrow: "Connect an app",
      workspace: input.workspace,
      head: `<meta http-equiv="refresh" content="0;url=${link}">`,
    },
    (input.allowed
      ? notice("success", "The app is connected. Go back to it.")
      : notice("warning", "Nothing was shared. The app was told you cancelled.")) +
      paragraph("If the app did not open, continue by hand:", "lead") +
      `<a class="btn${input.allowed ? " primary" : ""}" href="${link}">Continue</a>`,
  );
}
