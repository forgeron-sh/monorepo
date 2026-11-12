// The workflow a tool's repository runs (docs/sdk.md §15, D-121, D-123): a preview per pushed branch,
// removed with the branch; production is updated from Forgeron. GitHub Actions proves which
// repository it runs for (OIDC, `id-token: write`): no token is stored in the repository. The action
// is `.github/actions/deploy` of the Forgeron repository, at the tag of the version that wrote this.

export const WORKFLOW_PATH = ".github/workflows/forgeron.yml";

/** The deploy action, at the release `version` of Forgeron. */
export const deployAction = (version: string) =>
  `forgeron-sh/monorepo/.github/actions/deploy@v${version}`;

/**
 * The workflow, for the CLI of `version`. `endpoint` is the workspace's address, for a repository with
 * no `.forgeron/project.json` that names it.
 */
export function workflow(options: { version: string; endpoint?: string }): string {
  const action = deployAction(options.version);
  const endpoint = options.endpoint ? `\n          endpoint: ${options.endpoint}` : "";
  const deployWith = endpoint ? `\n        with:${endpoint}` : "";
  return `# Each pushed branch is a preview of the tool; a deleted branch's preview goes (docs/lifecycle.md).
# Production takes the update of the production branch, from the tool's page in Forgeron.
# No secret: GitHub tells Forgeron which repository this is (id-token: write), and Forgeron deploys
# the tool linked to it. A FORGERON_TOKEN given as \`token\` still works.
on:
  push:
    branches: ["**"]
  delete:
permissions:
  contents: read
  id-token: write
jobs:
  deploy:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ${action}${deployWith}
  close:
    if: github.event_name == 'delete' && github.event.ref_type == 'branch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ${action}
        with:
          close: "true"
          branch: \${{ github.event.ref }}${endpoint}
`;
}
