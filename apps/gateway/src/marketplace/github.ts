// Reading a marketplace on GitHub (D-116): its index through the contents API, a bundle through the
// releases API. A private repository needs a read token (a fine-grained token with "Contents: read");
// it goes in the `Authorization` header to api.github.com only. The download of an asset is redirected
// to GitHub's storage, and `fetch` drops the header on that cross-origin redirect.
import {
  MARKETPLACE_INDEX,
  MarketplaceIndexSchema,
  type MarketplaceIndex,
} from "@forgeron/manifest";

const API = "https://api.github.com";
/** A bundle is a built Worker with its docs: a few MB. Anything far larger is refused before it is read. */
const MAX_BUNDLE_BYTES = 25 * 1024 * 1024;

export class MarketplaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketplaceError";
  }
}

export interface GitHubReader {
  repo: string;
  token?: string;
  fetch: typeof fetch;
}

const headers = (reader: GitHubReader, accept: string): Record<string, string> => ({
  accept,
  "user-agent": "forgeron-gateway",
  "x-github-api-version": "2022-11-28",
  ...(reader.token ? { authorization: `Bearer ${reader.token}` } : {}),
});

const path = (repo: string) => repo.split("/").map(encodeURIComponent).join("/");

function refused(status: number, what: string, reader: GitHubReader): MarketplaceError {
  if (status === 401) return new MarketplaceError(`GitHub refused the token for ${reader.repo}.`);
  if (status === 403 || status === 404) {
    return new MarketplaceError(
      reader.token
        ? `${what} of ${reader.repo} is not found, or the token cannot read it.`
        : `${what} of ${reader.repo} is not found: a private repository needs a read token.`,
    );
  }
  return new MarketplaceError(
    `GitHub answered ${status} for ${what.toLowerCase()} of ${reader.repo}.`,
  );
}

/** The index at the root of the default branch, checked against its schema. */
export async function readIndex(reader: GitHubReader): Promise<MarketplaceIndex> {
  const response = await reader.fetch(
    `${API}/repos/${path(reader.repo)}/contents/${MARKETPLACE_INDEX}`,
    {
      headers: headers(reader, "application/vnd.github.raw+json"),
    },
  );
  if (!response.ok) throw refused(response.status, "The index", reader);
  let body: unknown;
  try {
    body = JSON.parse(await response.text());
  } catch {
    throw new MarketplaceError(`${MARKETPLACE_INDEX} of ${reader.repo} is not JSON.`);
  }
  const parsed = MarketplaceIndexSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new MarketplaceError(
      `${MARKETPLACE_INDEX} of ${reader.repo} is not a marketplace index${issue ? ` (${issue.path.join(".") || "root"}: ${issue.message})` : ""}.`,
    );
  }
  return parsed.data;
}

/** The bytes of one file attached to a release, refused above `MAX_BUNDLE_BYTES`. */
export async function downloadAsset(
  reader: GitHubReader,
  release: string,
  asset: string,
): Promise<Uint8Array> {
  const found = await reader.fetch(
    `${API}/repos/${path(reader.repo)}/releases/tags/${encodeURIComponent(release)}`,
    { headers: headers(reader, "application/vnd.github+json") },
  );
  if (!found.ok) throw refused(found.status, `The release ${release}`, reader);
  const body = (await found.json()) as {
    assets?: Array<{ name?: unknown; url?: unknown; size?: unknown }>;
  };
  const file = body.assets?.find((a) => a.name === asset);
  if (!file || typeof file.url !== "string") {
    throw new MarketplaceError(`The release ${release} of ${reader.repo} has no file ${asset}.`);
  }
  if (typeof file.size === "number" && file.size > MAX_BUNDLE_BYTES) {
    throw new MarketplaceError(`${asset} is over ${MAX_BUNDLE_BYTES} bytes.`);
  }
  // Only an address of the API is followed with the token.
  if (!file.url.startsWith(`${API}/repos/`)) {
    throw new MarketplaceError(`The release ${release} names an asset outside GitHub's API.`);
  }
  const response = await reader.fetch(file.url, {
    headers: headers(reader, "application/octet-stream"),
    redirect: "follow",
  });
  if (!response.ok) throw refused(response.status, `The file ${asset}`, reader);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_BUNDLE_BYTES) {
    throw new MarketplaceError(`${asset} is over ${MAX_BUNDLE_BYTES} bytes.`);
  }
  return bytes;
}
