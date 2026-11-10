// The public surface of the marketplaces module: the only file another part of the registry may import.
export { createMarketplaces } from "./store";
export { marketplacesMigrations } from "./migrations";
export { marketplaceSource } from "./types";
export type { Marketplace } from "./types";
