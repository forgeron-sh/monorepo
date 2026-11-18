import { createHash } from "node:crypto";
import { categories, getIcon, manifest } from "@forgeron/icons/catalog";
import type { IndexFile, BatchFile } from "./wire";

// Build time only: the catalog split into the files the gallery fetches. The index (names,
// categories, search words) comes first and is small; the drawings follow in batches of
// neighbouring names, fetched as tiles need them. Every file sits under a version made from its
// content, so a browser may keep it for good: a new set of icons gets new addresses.

/** Icons per batch: about 20 KB gzipped each, a dozen batches for the whole set. */
const BATCH_SIZE = 560;

interface CatalogData {
  readonly version: string;
  readonly index: IndexFile;
  readonly batches: readonly BatchFile[];
}

let data: CatalogData | undefined;

export function catalogData(): CatalogData {
  if (data) return data;
  const batches: BatchFile[] = [];
  const entries = manifest.map((entry, i): IndexFile["entries"][number] => {
    const batch = Math.floor(i / BATCH_SIZE);
    const icon = getIcon(entry.name);
    if (!icon) throw new Error(`"${entry.name}" has no icon.`);
    const file = (batches[batch] ??= {});
    file[entry.name] = [
      icon.grid,
      icon.rows,
      entry.export,
      entry.description,
      entry.sameAs,
      entry.reference,
      entry.trademark,
    ];
    // The words of the name are searched through the name itself: only the other words travel.
    const words = new Set(entry.name.split("-"));
    return [
      entry.name,
      entry.category,
      entry.labels.filter((l) => !words.has(l)),
      entry.aliases,
      entry.variants.duo ? 1 : 0,
      batch,
    ];
  });
  const body = { categories: categories.map((c) => [c.id, c.label] as const), entries };
  const version = createHash("sha256")
    .update(JSON.stringify([body, batches]))
    .digest("hex")
    .slice(0, 12);
  data = { version, index: { version, batchCount: batches.length, ...body }, batches };
  return data;
}
