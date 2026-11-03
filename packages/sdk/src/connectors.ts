import type { Connector } from "@forgeron/manifest";
import type { Fetch, FetchInit, FetchResponse } from "./context";
import { ToolError } from "./errors";

// The interface every `@forgeron/connector-<name>` package implements (docs/sdk.md section 10).
// A connector says which hosts it talks to, which modes and scopes it supports, and how to wrap
// an authenticated `fetch` into the client a tool receives on `ctx.connectors.<name>`.

export type ConnectorMode = Connector["mode"];

/** What a tool declares with `connector(type, { mode, scopes, why })`. */
export type ConnectorDeclaration = Connector;

/**
 * What the platform lends a connector for one call.
 * `delegated`: the token is the person's, obtained through the consent the platform manages.
 * `application`: the token is the tool's, from the consent the admin gave once.
 */
export interface ConnectorSession {
  mode: ConnectorMode;
  /** The scopes the tool declared, already checked against the connector's catalog. */
  scopes: readonly string[];
  /** The access token for this mode; the connector never stores it. */
  token(): Promise<string>;
  /** The platform's outbound `fetch`, unfiltered by the tool's `resources.network`. */
  fetch: Fetch;
}

/**
 * What `ctx.connectors.<name>` exposes. The authenticated `fetch` is always there; a connector
 * that bundles an official client adds it next to it (`ctx.connectors.microsoft.graph`).
 */
export type ConnectorClient<Extra extends object = object> = {
  /** Already authenticated, and limited to the hosts of the connector. */
  readonly fetch: Fetch;
  readonly mode: ConnectorMode;
  readonly scopes: readonly string[];
} & Extra;

export interface ConnectorDefinition<Extra extends object = object> {
  /** The `type` of `connector(type, ...)`: `"microsoft-365"`, `"odoo"`. */
  type: string;
  /**
   * The hosts the connector reaches: exact (`graph.microsoft.com`) or `*.` wildcards. A connector
   * whose host depends on the instance (Odoo) takes it from `hosts(declaration)`.
   */
  hosts: readonly string[] | ((session: Pick<ConnectorSession, "mode" | "scopes">) => string[]);
  /** The modes the upstream supports. */
  modes: readonly ConnectorMode[];
  /** The scopes the upstream knows; a tool that asks for another one is refused at build. */
  scopes: readonly string[];
  /** The official client when one exists, built on the authenticated `fetch`. */
  client?(fetch: Fetch, session: ConnectorSession): Extra;
}

/** Declares a connector: checks the definition and returns it. */
export function defineConnector<Extra extends object = object>(
  definition: ConnectorDefinition<Extra>,
): ConnectorDefinition<Extra> {
  if (!/^[a-z][a-z0-9-]*$/.test(definition.type)) {
    throw new Error(`Connector type "${definition.type}" must match [a-z][a-z0-9-]*.`);
  }
  if (definition.modes.length === 0) {
    throw new Error(`Connector "${definition.type}" supports no mode.`);
  }
  return definition;
}

/**
 * The problems of a declaration against a connector: wrong type, unsupported mode, unknown
 * scope. Empty when it can be used.
 */
export function checkConnectorDeclaration(
  definition: ConnectorDefinition,
  declaration: ConnectorDeclaration,
): string[] {
  const problems: string[] = [];
  if (declaration.type !== definition.type) {
    problems.push(`Connector "${definition.type}" cannot serve type "${declaration.type}".`);
  }
  if (!definition.modes.includes(declaration.mode)) {
    problems.push(`Connector "${definition.type}" does not support mode "${declaration.mode}".`);
  }
  for (const scope of declaration.scopes) {
    if (!definition.scopes.includes(scope)) {
      problems.push(`Connector "${definition.type}" does not know the scope "${scope}".`);
    }
  }
  return problems;
}

function hostAllowed(host: string, patterns: readonly string[]): boolean {
  const lower = host.toLowerCase();
  return patterns.some((pattern) => {
    const p = pattern.toLowerCase();
    return p.startsWith("*.") ? lower.endsWith(p.slice(1)) : lower === p;
  });
}

/** The hosts a connector may reach for this session. */
export function connectorHosts(
  definition: ConnectorDefinition,
  session: Pick<ConnectorSession, "mode" | "scopes">,
): string[] {
  return typeof definition.hosts === "function" ? definition.hosts(session) : [...definition.hosts];
}

/**
 * Builds `ctx.connectors.<name>` from a session: an `authorization` header is added to each
 * call, and a call to any host outside the connector's raises `FORBIDDEN`.
 */
export function createConnectorClient<Extra extends object>(
  definition: ConnectorDefinition<Extra>,
  declaration: ConnectorDeclaration,
  session: ConnectorSession,
): ConnectorClient<Extra> {
  const problems = checkConnectorDeclaration(definition as ConnectorDefinition, declaration);
  if (problems.length > 0) throw new ToolError("FORBIDDEN", problems.join(" "));
  if (session.mode !== declaration.mode) {
    throw new ToolError(
      "FORBIDDEN",
      `The session is "${session.mode}", the tool declared "${declaration.mode}".`,
    );
  }

  const hosts = connectorHosts(definition as ConnectorDefinition, session);
  const authenticated = async (url: string, init: FetchInit = {}): Promise<FetchResponse> => {
    const host = new URL(url).hostname;
    if (!hostAllowed(host, hosts)) {
      throw new ToolError("FORBIDDEN", `Connector "${definition.type}" does not reach "${host}".`);
    }
    const headers = { ...init.headers, authorization: `Bearer ${await session.token()}` };
    return session.fetch(url, { ...init, headers });
  };

  const base = { fetch: authenticated, mode: session.mode, scopes: session.scopes };
  return { ...base, ...definition.client?.(authenticated, session) } as ConnectorClient<Extra>;
}
