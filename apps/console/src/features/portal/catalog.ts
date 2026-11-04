import type {
  CatalogTool as CatalogToolContract,
  ToolCard as ToolCardContract,
} from "@forgeron/manifest";
import type { FetchJson } from "../../api";

// The catalog the console draws: `GET /api/catalog` and `GET /api/catalog/<tool>`. The shapes are those
// of `CatalogResponse` and `ToolCard` in `@forgeron/manifest` (FOR-137, D-061). The answers are read
// defensively, without the schema (no zod in the browser), so a field the platform adds or drops
// never breaks a screen.

export type CatalogTool = CatalogToolContract;

/** A tool card; the changelog is flattened to lines of text, the contract leaves its entries free-form. */
export type ToolCardData = Omit<ToolCardContract, "lastRelease"> & {
  lastRelease: { version: string; date: string; changelog: string[] } | null;
};

type Raw = Record<string, any>;
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const list = <T>(value: unknown, read: (item: Raw) => T): T[] =>
  Array.isArray(value)
    ? value.filter((v): v is Raw => typeof v === "object" && v !== null).map(read)
    : [];

/** Only an address of the console API's catalog is ever put in an `<img>`. */
const ASSET_URL = /^\/console-api\/api\/catalog\/[^/?#]+\/assets\/[^?#]+(\?v=[\w-]+)?$/;

function readTool(raw: Raw): CatalogTool {
  return {
    name: str(raw.name),
    title: str(raw.title) || str(raw.name),
    summary: str(raw.summary),
    icon: typeof raw.icon === "string" ? raw.icon : null,
    productionVersion: typeof raw.productionVersion === "string" ? raw.productionVersion : null,
    interfaces: {
      mcp: raw.interfaces?.mcp === true,
      api: raw.interfaces?.api === true,
      cli: raw.interfaces?.cli === true,
      web: raw.interfaces?.web === true,
    },
    access: raw.access === "granted" ? "granted" : "requestable",
    roles: list(raw.roles, (r) => ({ name: str(r.name), label: str(r.label) || str(r.name) })),
  };
}

export async function loadCatalog(fetchJson: FetchJson): Promise<CatalogTool[]> {
  const body = (await fetchJson("/api/catalog")) as { tools?: unknown };
  return list(body.tools, readTool);
}

/** A changelog entry is free-form for now: a string, or an object with a line of text in it. */
const changelogLine = (entry: unknown): string => {
  if (typeof entry === "string") return entry;
  if (typeof entry === "object" && entry !== null)
    for (const key of ["text", "summary", "title", "description", "message"])
      if (typeof (entry as Raw)[key] === "string") return (entry as Raw)[key];
  return "";
};

export async function loadToolCard(fetchJson: FetchJson, name: string): Promise<ToolCardData> {
  const raw = (await fetchJson(`/api/catalog/${encodeURIComponent(name)}`)) as Raw;
  if (!str(raw.name)) throw new Error("The platform answered without a tool.");
  const release = raw.lastRelease as Raw | null | undefined;
  return {
    ...readTool(raw),
    readme: typeof raw.readme === "string" ? raw.readme : null,
    assets: list(raw.assets, (a) => ({
      path: str(a.path),
      type: str(a.type),
      size: typeof a.size === "number" ? a.size : 0,
      url: str(a.url),
    })).filter((a) => a.path && ASSET_URL.test(a.url)),
    connect: {
      mcp: raw.connect?.mcp?.url ? { url: String(raw.connect.mcp.url) } : null,
      api: raw.connect?.api?.baseUrl ? { baseUrl: String(raw.connect.api.baseUrl) } : null,
      cli: raw.connect?.cli?.command ? { command: String(raw.connect.cli.command) } : null,
    },
    requiredSecrets: list(raw.requiredSecrets, (s) => ({
      name: str(s.name),
      why: typeof s.why === "string" ? s.why : null,
    })),
    requiredUserSecrets: list(raw.requiredUserSecrets, (s) => ({
      name: str(s.name),
      label: str(s.label) || str(s.name),
      why: str(s.why),
    })),
    connectors: list(raw.connectors, (c) => ({
      name: str(c.name),
      type: str(c.type),
      mode: c.mode === "application" ? "application" : "delegated",
    })),
    yourAccess: list(raw.yourAccess, (a) => ({
      action: str(a.action),
      allowed: a.allowed === true,
    })),
    lastRelease: release
      ? {
          version: str(release.version),
          date: str(release.date),
          changelog: Array.isArray(release.changelog)
            ? release.changelog.map(changelogLine).filter(Boolean)
            : [],
        }
      : null,
  };
}

/** The README's image paths and the addresses that serve them: what the markdown view may draw. */
export const imagesOf = (card: ToolCardData): Record<string, string> =>
  Object.fromEntries(card.assets.map((a) => [a.path, a.url]));

const INTERFACE_LABELS: ReadonlyArray<["mcp" | "api" | "cli" | "web", string]> = [
  ["mcp", "MCP"],
  ["api", "API"],
  ["cli", "CLI"],
  ["web", "Web"],
];

/** The interfaces a tool exposes, in the order a person reaches for them. */
export const interfacesOf = (tool: CatalogTool) =>
  INTERFACE_LABELS.filter(([key]) => tool.interfaces[key]).map(([, label]) => label);
