import type { PixelIcon } from "@forgeron/icons";
import { batchUrl, indexUrl, type BatchFile, type IndexFile } from "./wire";

// How the gallery gets the catalog: the index once, then the batches of drawings that the tiles on
// screen need, each fetched once. A file is kept in the browser's Cache Storage under the version
// of the set, so a second visit reads it from disk without asking the server; when the set
// changes, the version changes and the old cache is deleted.

export interface GalleryEntry {
  readonly name: string;
  readonly category: string;
  /** Search words other than those of the name. */
  readonly labels: readonly string[];
  readonly aliases: readonly string[];
  readonly duo: boolean;
  readonly batch: number;
  /** Position in the catalog, from 1: the figure number of the tile. */
  readonly index: number;
}

export interface IconData {
  readonly icon: PixelIcon;
  readonly export: string;
  readonly description: string;
  readonly sameAs: string | null;
  readonly reference: string | null;
  readonly trademark: string | null;
}

export interface Catalog {
  readonly version: string;
  readonly categories: readonly { readonly id: string; readonly label: string }[];
  readonly entries: readonly GalleryEntry[];
}

const CACHE_PREFIX = "forgeron-icons-";

async function openCache(version: string): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    const name = CACHE_PREFIX + version;
    for (const old of await caches.keys()) {
      if (old.startsWith(CACHE_PREFIX) && old !== name) void caches.delete(old);
    }
    return await caches.open(name);
  } catch {
    // Private windows and some embedded browsers refuse Cache Storage: the HTTP cache remains.
    return null;
  }
}

/** A JSON file of the set: from the cache of this version when it is there, else from the server. */
async function cachedJson<T>(cache: Cache | null, url: string): Promise<T> {
  const hit = await cache?.match(url).catch(() => undefined);
  if (hit) return (await hit.json()) as T;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  await cache?.put(url, response.clone()).catch(() => undefined);
  return (await response.json()) as T;
}

export function createLoader(version: string) {
  const cache = openCache(version);
  const icons = new Map<string, IconData>();
  const pending = new Map<number, Promise<void>>();
  const listeners = new Set<() => void>();

  async function catalog(): Promise<Catalog> {
    const file = await cachedJson<IndexFile>(await cache, indexUrl(version));
    return {
      version: file.version,
      categories: file.categories.map(([id, label]) => ({ id, label })),
      entries: file.entries.map(([name, category, labels, aliases, duo, batch], i) => ({
        name,
        category,
        labels,
        aliases,
        duo: duo === 1,
        batch,
        index: i + 1,
      })),
    };
  }

  function loadBatch(batch: number): Promise<void> {
    const known = pending.get(batch);
    if (known) return known;
    const job = (async () => {
      const file = await cachedJson<BatchFile>(await cache, batchUrl(version, batch));
      for (const [
        name,
        [grid, rows, id, description, sameAs, reference, trademark],
      ] of Object.entries(file)) {
        icons.set(name, {
          icon: { name, style: "pixel", grid, rows },
          export: id,
          description,
          sameAs,
          reference,
          trademark,
        });
      }
      for (const listener of listeners) listener();
    })();
    // A failed batch may be asked again.
    job.catch(() => pending.delete(batch));
    pending.set(batch, job);
    return job;
  }

  return {
    catalog,
    /** Asks for the batches of these entries that are not loaded or loading yet. */
    need(entries: Iterable<GalleryEntry>): void {
      const batches = new Set<number>();
      for (const e of entries) if (!icons.has(e.name)) batches.add(e.batch);
      for (const b of batches) void loadBatch(b);
    },
    get: (name: string) => icons.get(name),
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Changes whenever a batch arrives, for `useSyncExternalStore`. */
    size: () => icons.size,
  };
}

export type Loader = ReturnType<typeof createLoader>;
