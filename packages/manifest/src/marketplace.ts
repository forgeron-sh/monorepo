import { z } from "zod";
import { ToolNameSchema } from "./schema";

// The index of a marketplace (D-116): `forgeron-marketplace.json` at the root of a GitHub repository.
// Each tool names the release that holds its bundle (`forgeron bundle`, D-115) and the SHA-256 of
// that file: the platform downloads it, checks the hash, then reads it as an untrusted build.

export const MARKETPLACE_INDEX = "forgeron-marketplace.json";

const SHA256 = /^[0-9a-f]{64}$/;

export const MarketplaceToolSchema = z.object({
  name: ToolNameSchema,
  /** Where the tool lives in the repository; for the reader, the platform does not use it. */
  path: z.string().optional(),
  version: z.string().min(1).max(64),
  /** The tag of the GitHub release that holds the bundle; `null` until a release is published. */
  release: z.string().min(1).max(200).nullable(),
  /** The file attached to that release: `<name>-<version>.forgeron.json`. */
  asset: z.string().min(1).max(200).nullable(),
  sha256: z.string().regex(SHA256).nullable(),
});

export const MarketplaceIndexSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
  tools: z.array(MarketplaceToolSchema).max(500),
});

export type MarketplaceTool = z.infer<typeof MarketplaceToolSchema>;
export type MarketplaceIndex = z.infer<typeof MarketplaceIndexSchema>;
