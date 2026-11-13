import { errorPage } from "./errors";
import {
  button,
  escape,
  facts,
  hiddenFields,
  linkButton,
  notice,
  page,
  paragraph,
  type PageOptions,
} from "./shell";

// The sign-in flow's pages (D-049): email, code, and the invitation landing. They say the same
// thing whoever the address is: nothing here tells an address that may sign in from one that may
// not.

/** Why a person is looking at the sign-in page, from `?reason=`. */
export type SignInReason = "expired" | "signed-out";

const REASONS: Record<SignInReason, { kind: "warning" | "success"; text: string }> = {
  expired: { kind: "warning", text: "Your session expired. Sign in again to continue." },
  "signed-out": { kind: "success", text: "You are signed out." },
};

export const reasonOf = (value: string | null): SignInReason | undefined =>
  value === "expired" || value === "signed-out" ? value : undefined;

export interface SignInPages {
  login(input: {
    next: string | undefined;
    /** The link of "Continue with your company account", when the workspace has one. */
    companyHref?: string;
    reason?: SignInReason;
    message?: string;
    status?: number;
  }): Response;
  code(input: {
    email: string | undefined;
    next: string | undefined;
    /** What to tell the person above the form. */
    sent?: boolean;
    message?: string;
    status?: number;
    headers?: Record<string, string>;
  }): Response;
  invitation(input: {
    inviter: string;
    /** The teams the invitation puts the person in; empty: none. */
    teams: string[];
    email: string;
    expiresAt: string;
    next: string | undefined;
  }): Response;
  invitationInvalid(): Response;
  refused(): Response;
  tooMany(retryAfter: number): Response;
}

export function signInPages(
  workspace: string,
  options: { codeMinutes: number; digits: number; testNotice?: string },
): SignInPages {
  const shell = (title: string, eyebrow: string, status = 200, headers?: Record<string, string>) =>
    ({
      title,
      eyebrow,
      workspace,
      status,
      ...(headers ? { headers } : {}),
    }) satisfies PageOptions;
  const test = options.testNotice ? notice("warning", options.testNotice) : "";

  const emailField = (value?: string) =>
    `<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" required ${value ? `value="${escape(value)}" ` : "autofocus "}>`;

  return {
    login({ next, companyHref, reason, message, status = 200 }) {
      const why = reason ? notice(REASONS[reason].kind, REASONS[reason].text) : "";
      const toCli = next?.startsWith("/auth/cli?")
        ? paragraph("Sign in to authorize the forgeron CLI.", "lead")
        : "";
      const company = companyHref
        ? `<a class="btn" href="${escape(companyHref)}">Continue with your company account</a><div class="divider">or</div>`
        : "";
      return page(
        shell(`Sign in to ${workspace}`, "Sign in", status),
        `${why}${message ? notice("danger", message) : ""}${toCli}${company}` +
          `<form method="post" action="/auth/email/request" class="stack">${hiddenFields({ next })}` +
          `<div>${emailField()}<span class="hint">We email you an ${options.digits}-digit code. No password.</span></div>` +
          `${button("Send me a code", { variant: "primary" })}</form>${test ? `<div style="margin-top:var(--space-4)">${test}</div>` : ""}`,
      );
    },

    code({ email, next, sent, message, status = 200, headers }) {
      const lead = sent
        ? paragraph(
            `If this address can sign in, we sent an ${options.digits}-digit code${email ? ` to ${email}` : ""}. It works once, for ${options.codeMinutes} minutes.`,
            "lead",
          )
        : paragraph(
            `Enter the ${options.digits}-digit code from the email. It works once, for ${options.codeMinutes} minutes.`,
            "lead",
          );
      const resend = email
        ? `<form method="post" action="/auth/email/request">${hiddenFields({ email, next })}${button("Send a new code", { variant: "link" })}</form>`
        : "";
      return page(
        shell("Enter your code", "Sign in", status, headers),
        `${message ? notice("danger", message) : ""}${lead}` +
          `<form method="post" action="/auth/email/verify" class="stack"><div><label for="code">Code</label>` +
          `<input id="code" class="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 \\-]*" maxlength="12" placeholder="0000 0000" aria-describedby="code-hint" required autofocus>` +
          `<span class="hint" id="code-hint">Paste it as it is: spaces are fine.</span></div>` +
          `${button("Sign in", { variant: "primary" })}</form>` +
          `<p class="small muted" style="margin:var(--space-4) 0 var(--space-2)">No email? Check your spam folder.</p>` +
          `<div class="links">${resend}<a href="/auth/login">Use another address</a></div>` +
          `${test ? `<div style="margin-top:var(--space-4)">${test}</div>` : ""}`,
      );
    },

    invitation({ inviter, teams, email, expiresAt, next }) {
      return page(
        shell(`Join ${workspace}`, "Invitation"),
        paragraph(`${inviter} invited you to the ${workspace} workspace.`) +
          facts([
            ["Workspace", workspace],
            ...(teams.length > 0
              ? ([["You join the teams", teams.join(", ")]] as Array<[string, string]>)
              : []),
            ["Invited by", inviter],
            ["Valid until", expiresAt.slice(0, 10)],
          ]) +
          `<form method="post" action="/auth/email/request" class="stack">${hiddenFields({ next, email })}` +
          `<div><label for="invited">Email</label><input id="invited" type="email" value="${escape(email)}" readonly aria-readonly="true"><span class="hint">We email an ${options.digits}-digit code to this address to confirm it is you.</span></div>` +
          `${button("Send me a code", { variant: "primary" })}</form>`,
      );
    },

    invitationInvalid() {
      return page(
        shell("This invitation is not valid", "Invitation", 404),
        paragraph("The link is wrong, or the invitation expired or was withdrawn.") +
          paragraph(
            "Ask the person who invited you to send a new one, or sign in if you already joined.",
            "lead",
          ) +
          linkButton("Go to sign in", "/auth/login", true),
      );
    },

    refused() {
      return errorPage(403, {
        workspace,
        detail: "This request did not come from the sign-in page.",
      });
    },

    tooMany(retryAfter) {
      return page(
        shell("Too many codes requested", "Sign in", 429, { "retry-after": String(retryAfter) }),
        paragraph("Too many codes were asked for from this address or for this email.") +
          paragraph("Wait an hour, then ask for a new code.", "lead") +
          linkButton("Back to sign in", "/auth/login"),
      );
    },
  };
}
