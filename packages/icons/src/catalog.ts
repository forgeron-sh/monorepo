import * as icons from "./generated/index";
import manifestData from "./generated/manifest.json";
import type { IconName } from "./generated/names";
import { CATEGORIES } from "./generator/taxonomy";
import type { IconCategory, IconDefinition, IconManifestEntry } from "./types";

// The whole catalog, for a gallery, a search or a script: every icon by name and the manifest.
// Importing this module pulls in every icon; an application imports the named exports instead.

export const manifest: readonly IconManifestEntry[] = manifestData as IconManifestEntry[];

export const categories: readonly IconCategory[] = CATEGORIES;

const byName = new Map<string, IconDefinition>(
  Object.values(icons as Record<string, IconDefinition>).map((icon) => [icon.name, icon]),
);
const entries = new Map<string, IconManifestEntry>(manifest.map((entry) => [entry.name, entry]));
const aliases = new Map<string, string>(
  manifest.flatMap((entry) => entry.aliases.map((alias) => [alias, entry.name] as const)),
);

/** The icon of a name or of one of its aliases, or `undefined` when the catalog has none. */
export function getIcon(name: IconName | (string & {})): IconDefinition | undefined {
  return byName.get(name) ?? byName.get(aliases.get(name) ?? "");
}

/** The manifest entry of a name or of one of its aliases. */
export function getEntry(name: IconName | (string & {})): IconManifestEntry | undefined {
  const icon = getIcon(name);
  return icon ? entries.get(icon.name) : undefined;
}
