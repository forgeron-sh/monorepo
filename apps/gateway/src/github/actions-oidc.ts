// The identity token of a GitHub Actions run (D-123): what lets CI deploy without a stored token.
// GitHub signs it (RS256, keys at its JWKS); the audience is the workspace's address, which the CLI
// asks for, so a token made for another workspace, or another service, is refused here.
import { checkClaims, fetchJwks, JwtError, verifyRs256 } from "../identity/authn/jwt";

export const ACTIONS_ISSUER = "https://token.actions.githubusercontent.com";
const JWKS = `${ACTIONS_ISSUER}/.well-known/jwks`;

/** Who a verified token says is calling: a workflow run of one repository. */
export interface ActionsRun {
  /** `owner/name`. */
  repository: string;
  /** GitHub's number for the repository: it survives a rename. */
  repositoryId?: number;
  /** `refs/heads/<branch>`, `refs/pull/<n>/merge`… */
  ref?: string;
  sha?: string;
  /** The GitHub login that started the run. */
  actor?: string;
}

/** Checks a GitHub Actions identity token for this workspace; throws `JwtError` when it is not one. */
export async function verifyActionsToken(
  token: string,
  options: { audience: string; now: Date; fetch: typeof fetch },
): Promise<ActionsRun> {
  const claims = await verifyRs256(token, () => fetchJwks(options.fetch, JWKS));
  checkClaims(claims, { issuer: ACTIONS_ISSUER, audience: options.audience, now: options.now });
  const { repository, repository_id: id, ref, sha, actor } = claims;
  if (typeof repository !== "string" || !repository.includes("/")) {
    throw new JwtError("The token names no repository.");
  }
  const repositoryId = typeof id === "string" || typeof id === "number" ? Number(id) : NaN;
  return {
    repository,
    ...(Number.isSafeInteger(repositoryId) ? { repositoryId } : {}),
    ...(typeof ref === "string" ? { ref } : {}),
    ...(typeof sha === "string" ? { sha } : {}),
    ...(typeof actor === "string" ? { actor } : {}),
  };
}
