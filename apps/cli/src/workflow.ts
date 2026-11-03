// The workflow `forgeron init` writes into a tool's repository (docs/sdk.md §15, D-004). The action
// is in `.github/actions/deploy` of this repository; its published name is still to be confirmed.

export const WORKFLOW_PATH = ".github/workflows/forgeron.yml";

export const WORKFLOW = `# Tests, checks and deploys every tool of this repository: a preview per branch.
# FORGERON_TOKEN is a deployment token: forgeron token create --name ci --scope deploy
on:
  push:
  pull_request:
jobs:
  forgeron:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@v4
      - uses: forgeron/deploy-action@v1 # name to be confirmed
        with:
          token: \${{ secrets.FORGERON_TOKEN }}
`;
