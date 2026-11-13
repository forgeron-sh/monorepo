import { linkButton, page, paragraph, prefersHtml, type PageOptions } from "./shell";

// The error pages: what happened, then what to do (docs/design-system.md). A browser navigation
// gets one of these; an API client keeps its JSON error.

interface Words {
  title: string;
  happened: string;
  todo: string;
}

const WORDS: Record<number, Words> = {
  400: {
    title: "This request is not valid",
    happened: "The request is missing something or is malformed.",
    todo: "Go back and try again.",
  },
  401: {
    title: "Sign in to continue",
    happened: "You are not signed in, or your session has ended.",
    todo: "Sign in, then come back to this page.",
  },
  403: {
    title: "You do not have access",
    happened: "Your account is not allowed to open this page.",
    todo: "Ask someone who manages the workspace for access.",
  },
  404: {
    title: "This page does not exist",
    happened: "There is nothing at this address.",
    todo: "Check the address, or go to the workspace home.",
  },
  405: {
    title: "This method is not allowed",
    happened: "This address does not accept that kind of request.",
    todo: "Open the address from a link instead.",
  },
  429: {
    title: "Too many requests",
    happened: "This address received too many requests in a short time.",
    todo: "Wait a few minutes, then try again.",
  },
  500: {
    title: "Something went wrong",
    happened: "The gateway failed to answer your request.",
    todo: "Try again in a moment. If it keeps failing, tell someone who manages the workspace.",
  },
  502: {
    title: "A service did not answer",
    happened: "A service the gateway depends on did not answer.",
    todo: "Try again in a moment.",
  },
};

export interface ErrorPageOptions {
  workspace?: string;
  /** Replaces the default sentence of what happened. */
  detail?: string;
  headers?: Record<string, string>;
}

/** The HTML page of an error status. */
export function errorPage(status: number, options: ErrorPageOptions = {}): Response {
  const words = WORDS[status] ?? WORDS[500]!;
  const shell: PageOptions = {
    title: words.title,
    eyebrow: `Error ${status}`,
    status,
    ...(options.workspace ? { workspace: options.workspace } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
  };
  const home =
    status === 401
      ? linkButton("Sign in", "/auth/login", true)
      : linkButton("Go to the workspace", "/", true);
  return page(
    shell,
    `${paragraph(options.detail ?? words.happened)}${paragraph(words.todo, "lead")}${home}`,
  );
}

/** An error page for a browser, the given JSON for any other client. */
export function negotiated(
  request: Request,
  status: number,
  json: Response,
  options: ErrorPageOptions = {},
): Response {
  return prefersHtml(request) ? errorPage(status, options) : json;
}
