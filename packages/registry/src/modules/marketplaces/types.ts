import type { Row } from "../../kernel/rows";
import { text } from "../../kernel/rows";

/** A marketplace a workspace added (D-116): a GitHub repository with a `forgeron-marketplace.json`. */
export interface Marketplace {
  id: string;
  workspace: string;
  /** `owner/name` on GitHub. */
  repo: string;
  /** The index's `title`, once a sync has read it. */
  title?: string;
  /** Whether a read token is kept (never the token itself). */
  hasToken: boolean;
  createdBy: string;
  createdAt: string;
  syncedAt?: string;
  /** Why the last sync failed, in words; absent after a sync that worked. */
  syncError?: string;
}

/** The hidden workspace that holds what a marketplace offers: its tools, as the catalogue holds templates. */
export const marketplaceSource = (id: string) => `@mp:${id}`;

/** `owner/name`: what GitHub accepts as an owner and a repository name. */
export const REPO = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/;

export const toMarketplace = (r: Row): Marketplace => ({
  id: String(r.id),
  workspace: String(r.workspace),
  repo: String(r.repo),
  ...(text(r.title) !== undefined ? { title: text(r.title)! } : {}),
  hasToken: text(r.ciphertext) !== undefined,
  createdBy: String(r.created_by),
  createdAt: String(r.created_at),
  ...(text(r.synced_at) !== undefined ? { syncedAt: text(r.synced_at)! } : {}),
  ...(text(r.sync_error) !== undefined ? { syncError: text(r.sync_error)! } : {}),
});
