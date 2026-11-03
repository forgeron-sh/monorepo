import type { FetchJson } from "../../api";

// The catalog the console draws: `GET /api/catalog` and `GET /api/catalog/<tool>`. The shapes are those
// of `CatalogResponse` and `ToolCard` in `@forgeron/manifest` (`catalog.ts`, FOR-137); they are declared
// here until that module is on main, and read defensively so a field the platform adds or drops never
// breaks a screen.

export interface CatalogTool {
  name: string;
  title: string;
  summary: string;
  icon: string | null;
  productionVersion: string | null;
  interfaces: { mcp?: boolean; api?: boolean; cli?: boolean; web?: boolean };
  /** `granted`: the person may use it. `requestable`: they could ask an admin for one of `roles`. */
  access: "granted" | "requestable";
  /** The roles of the tool that may call at least one action: what to ask for. */
  roles: Array<{ name: string; label: string }>;
}

interface ToolAsset {
  path: string;
  type: string;
  size: number;
  /** Ready for an `<img>`; ends with `?v=<hash>`. */
  url: string;
}

export interface ToolCardData extends CatalogTool {
  /** The README, markdown source. */
  readme: string | null;
  assets: ToolAsset[];
  connect: {
    mcp: { url: string } | null;
    api: { baseUrl: string } | null;
    cli: { command: string } | null;
  };
  /** Set by an admin: informative. */
  requiredSecrets: Array<{ name: string; why: string | null }>;
  /** What the person is asked for. */
  requiredUserSecrets: Array<{ name: string; label: string; why: string }>;
  connectors: Array<{ name: string; type: string; mode: string }>;
  yourAccess: Array<{ action: string; allowed: boolean }>;
  lastRelease: { version: string; date: string; changelog: string[] } | null;
}

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
      mode: str(c.mode),
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
