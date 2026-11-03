import { stylesheet } from "./css";

// The page shell of every HTML page the gateway serves (docs/design-system.md): the logo, one
// content card, the footer, and the notice blocks. Server-rendered, one stylesheet inlined from
// the design tokens, no script, no font or image download: the CSP below allows nothing else.

/** The anvil of assets/logos (viewBox 132), the same path as `packages/ui`. */
const ANVIL = "M0 0H132L81.506 50.494A29 29 0 0 0 102.012 100H132V132H0V100A33 33 0 0 0 0 34Z";

/** The policy of the sign-in pages (D-049). Not loosened for any page of the shell. */
const PAGE_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

export const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export interface PageOptions {
  /** The title of the page and its heading: a short sentence-case phrase. */
  title: string;
  /** A small mono line above the heading ("Sign in", "Invitation"). */
  eyebrow?: string;
  /** The workspace, named at the top right and in the footer. */
  workspace?: string;
  status?: number;
  headers?: Record<string, string>;
  /** Extra markup for `<head>` (the CLI hand-back refresh). Trusted: escape what it carries. */
  head?: string;
}

const symbol = (size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 132 132" aria-hidden="true" focusable="false"><path fill="currentColor" d="${ANVIL}"/></svg>`;

/** A complete document. `body` is trusted markup: build it with `escape` and the helpers below. */
function renderPage(options: PageOptions, body: string): string {
  const where = options.workspace ? `<span class="where">${escape(options.workspace)}</span>` : "";
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="dark light"><meta name="robots" content="noindex">` +
    `<title>${escape(options.title)} · Forgeron</title>${options.head ?? ""}` +
    `<style>${stylesheet()}</style></head><body>` +
    `<svg class="anvil" viewBox="0 0 132 132" aria-hidden="true" focusable="false"><path fill="currentColor" d="${ANVIL}"/></svg>` +
    `<header class="bar"><span class="brand" role="img" aria-label="Forgeron">${symbol(22)}<span aria-hidden="true">forgeron</span></span>${where}</header>` +
    `<main><div class="card">` +
    (options.eyebrow ? `<p class="eyebrow">${escape(options.eyebrow)}</p>` : "") +
    `<h1>${escape(options.title)}</h1>${body}</div></main>` +
    `<footer><span>Forgeron</span>${options.workspace ? `<span>${escape(options.workspace)}</span>` : ""}</footer>` +
    `</body></html>`
  );
}

/** The response of a page: the CSP and the cache and referrer headers every page carries. */
export function page(options: PageOptions, body: string): Response {
  return new Response(renderPage(options, body), {
    status: options.status ?? 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": PAGE_CSP,
      "cache-control": "no-store",
      // Not `no-referrer`: with it a browser sends `Origin: null` on this page's own form posts
      // (Fetch, "append a request Origin header"), and the origin check would refuse them.
      "referrer-policy": "same-origin",
      "x-content-type-options": "nosniff",
      ...options.headers,
    },
  });
}

type NoticeKind = "info" | "success" | "warning" | "danger";
const TAGS: Record<NoticeKind, string> = {
  info: "Note",
  success: "Done",
  warning: "Warning",
  danger: "Error",
};

/** A block that says one thing. Color is never alone: the tag names the state. */
export const notice = (kind: NoticeKind, text: string): string =>
  `<p class="notice ${kind}"${kind === "danger" ? ` role="alert"` : ` role="status"`}><span class="tag">${TAGS[kind]}</span><span>${escape(text)}</span></p>`;

export const paragraph = (text: string, className = ""): string =>
  `<p${className ? ` class="${className}"` : ""}>${escape(text)}</p>`;

export const hiddenFields = (fields: Record<string, string | undefined>): string =>
  Object.entries(fields)
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== "")
    .map(([name, value]) => `<input type="hidden" name="${escape(name)}" value="${escape(value)}">`)
    .join("");

export interface ButtonOptions {
  variant?: "primary" | "secondary" | "link";
  name?: string;
  value?: string;
}

/** A submit button: an imperative verb, no period. */
export const button = (label: string, options: ButtonOptions = {}): string =>
  `<button type="submit" class="btn ${options.variant ?? "secondary"}"${options.name ? ` name="${escape(options.name)}" value="${escape(options.value ?? "")}"` : ""}>${escape(label)}</button>`;

/** A link that looks like a button. */
export const linkButton = (label: string, href: string, primary = false): string =>
  `<a class="btn${primary ? " primary" : ""}" href="${escape(href)}">${escape(label)}</a>`;

/** A `facts` list: label and value rows, the values in mono. */
export const facts = (rows: Array<[label: string, value: string]>): string =>
  `<dl class="facts">${rows.map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join("")}</dl>`;

/** The browser asked for a page (a navigation), not for JSON. */
export const prefersHtml = (request: Request): boolean =>
  (request.headers.get("accept") ?? "").includes("text/html");
