import type {
  CatalogTool as CatalogToolContract,
  ToolCard as ToolCardContract,
} from "@forgeron/manifest";
import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient, type FetchJson } from "../../api";

// The catalog the console draws: `GET /api/catalog` and `GET /api/catalog/<tool>`. The shapes are those
// of `CatalogResponse` and `ToolCard` in `@forgeron/manifest` (FOR-137, D-061); the calls go through the
// contract's typed client (FOR-151, D-064), so a change of the contract fails to compile here. The
// answers are not validated at run time (no schema is run in the browser).

export type CatalogTool = CatalogToolContract;

/** A tool card; the changelog is flattened to lines of text, the contract leaves its entries free-form. */
export type ToolCardData = Omit<ToolCardContract, "lastRelease"> & {
  lastRelease: { version: string; date: string; changelog: string[] } | null;
};

type Raw = Record<string, unknown>;

/** Only an address of the console API's catalog is ever put in an `<img>`. */
const ASSET_URL = /^\/console-api\/api\/catalog\/[^/?#]+\/assets\/[^?#]+(\?v=[\w-]+)?$/;

export async function loadCatalog(fetchJson: FetchJson): Promise<CatalogTool[]> {
  return ok(await typedClient(fetchJson)(addresses.listCatalog)).tools;
}

/** A changelog entry is free-form for now: a string, or an object with a line of text in it. */
const changelogLine = (entry: unknown): string => {
  if (typeof entry === "string") return entry;
  if (typeof entry === "object" && entry !== null)
    for (const key of ["text", "summary", "title", "description", "message"])
      if (typeof (entry as Raw)[key] === "string") return (entry as Raw)[key] as string;
  return "";
};

export async function loadToolCard(fetchJson: FetchJson, name: string): Promise<ToolCardData> {
  const card = ok(await typedClient(fetchJson)(addresses.toolCard, { params: { tool: name } }));
  if (!card.name) throw new Error("The platform answered without a tool.");
  return {
    ...card,
    assets: card.assets.filter((a) => a.path && ASSET_URL.test(a.url)),
    lastRelease: card.lastRelease
      ? {
          ...card.lastRelease,
          changelog: card.lastRelease.changelog.map(changelogLine).filter(Boolean),
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
