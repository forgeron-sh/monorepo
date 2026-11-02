import type { Cache, CacheOptions } from "../context";

/** A cache in memory, for tests: values never expire. Per-person by default, as in production. */
export function memoryCache(userId: string, store: Map<string, unknown>): Cache {
  const keyOf = (key: string, scope: CacheOptions["scope"] = "user") =>
    `${scope === "tool" ? "tool" : `user:${userId}`}:${key}`;
  return {
    get: async <T>(key: string, options?: Pick<CacheOptions, "scope">) =>
      store.get(keyOf(key, options?.scope)) as T | undefined,
    set: async (key, value, options) => {
      store.set(keyOf(key, options?.scope), value);
    },
    getOrSet: async <T>(key: string, options: CacheOptions, compute: () => Promise<T>) => {
      const full = keyOf(key, options.scope);
      if (store.has(full)) return store.get(full) as T;
      const value = await compute();
      store.set(full, value);
      return value;
    },
    delete: async (key, options) => {
      store.delete(keyOf(key, options?.scope));
    },
  };
}
