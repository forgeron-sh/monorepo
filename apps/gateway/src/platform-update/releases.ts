// The releases of the repository an install updates from (D-138), through GitHub's REST API with no
// token: a public repository needs none, and the gateway holds none to give. The answer is kept in
// memory for ten minutes so that opening the console does not spend GitHub's unauthenticated rate
// limit (60 requests an hour per address); a failure is kept for a minute for the same reason.
import { compareVersions, versionOfTag } from "./version";

export const DEFAULT_UPDATE_REPOSITORY = "forgeron-sh/monorepo";
export const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
/** The files a release carries (`scripts/platform-artifact.ts`). */
export const ARTIFACT_FILE = "forgeron-platform.json";
export const CHECKSUM_FILE = `${ARTIFACT_FILE}.sha256`;

const TTL_MS = 10 * 60_000;
const FAILURE_TTL_MS = 60_000;
const MAX_NOTES = 50_000;

export interface Release {
  /** `0.6.0`, the tag without its `v`. */
  version: string;
  publishedAt: string;
  /** The release's page on GitHub. */
  url: string;
  /** The release body, markdown. */
  notes: string;
  /** Whether the release carries the platform artifact and its checksum. */
  hasArtifact: boolean;
}

/** GitHub could not be asked, or answered something else than a list of releases. */
class ReleasesError extends Error {
  override name = "ReleasesError";
}

interface GithubRelease {
  tag_name?: unknown;
  draft?: unknown;
  prerelease?: unknown;
  published_at?: unknown;
  html_url?: unknown;
  body?: unknown;
  assets?: unknown;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

export function createReleases(options: { fetch: typeof fetch; now: () => Date }) {
  const cache = new Map<
    string,
    { at: number; release: Release | undefined } | { at: number; error: string }
  >();

  async function read(repository: string): Promise<Release | undefined> {
    let response: Response;
    try {
      response = await options.fetch(
        `https://api.github.com/repos/${repository}/releases?per_page=100`,
        {
          headers: {
            accept: "application/vnd.github+json",
            "user-agent": "forgeron-gateway",
            "x-github-api-version": "2022-11-28",
          },
        },
      );
    } catch {
      throw new ReleasesError("GitHub could not be reached.");
    }
    if (response.status === 403 || response.status === 429) {
      throw new ReleasesError("GitHub's rate limit is reached: try again in a few minutes.");
    }
    if (response.status === 404) {
      throw new ReleasesError(`GitHub has no repository ${repository}, or it is private.`);
    }
    if (!response.ok) throw new ReleasesError(`GitHub answered ${response.status}.`);
    const list = (await response.json().catch(() => undefined)) as unknown;
    if (!Array.isArray(list)) throw new ReleasesError("GitHub answered something unexpected.");

    let latest: Release | undefined;
    for (const item of list as GithubRelease[]) {
      if (item.draft === true || item.prerelease === true) continue;
      const version = versionOfTag(text(item.tag_name));
      if (!version) continue;
      if (latest && compareVersions(version, latest.version) <= 0) continue;
      const names = Array.isArray(item.assets)
        ? (item.assets as { name?: unknown }[]).map((a) => text(a.name))
        : [];
      latest = {
        version,
        publishedAt: text(item.published_at),
        url: text(item.html_url) || `https://github.com/${repository}/releases/tag/v${version}`,
        notes: text(item.body).slice(0, MAX_NOTES),
        hasArtifact: names.includes(ARTIFACT_FILE) && names.includes(CHECKSUM_FILE),
      };
    }
    return latest;
  }

  return {
    /**
     * The highest `v<semver>` release of the repository that is neither a draft nor a prerelease, or
     * `undefined` when there is none. Throws `ReleasesError` when GitHub cannot say.
     */
    async latest(repository: string): Promise<Release | undefined> {
      const at = options.now().getTime();
      const kept = cache.get(repository);
      if (kept && at - kept.at < ("error" in kept ? FAILURE_TTL_MS : TTL_MS)) {
        if ("error" in kept) throw new ReleasesError(kept.error);
        return kept.release;
      }
      try {
        const release = await read(repository);
        cache.set(repository, { at, release });
        return release;
      } catch (error) {
        const message =
          error instanceof ReleasesError ? error.message : "GitHub could not be read.";
        cache.set(repository, { at, error: message });
        throw new ReleasesError(message);
      }
    },
  };
}
