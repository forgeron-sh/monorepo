// The branch CI is building (D-121): the pull request's (`GITHUB_HEAD_REF`), else the pushed one
// (`GITHUB_REF_NAME`). GitHub sets `GITHUB_HEAD_REF` to an empty string on a push, so an empty value
// counts as unset.
export function ciBranch(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  return env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || undefined;
}
