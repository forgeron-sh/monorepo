// The workflow `forgeron init` writes into a tool's repository (docs/sdk.md §15, D-004, D-121): a
// preview per pushed branch, removed with the branch; production is updated from Forgeron. The action
// is in `.github/actions/deploy` of this repository; its published name is still to be confirmed.

export const WORKFLOW_PATH = ".github/workflows/forgeron.yml";

export const WORKFLOW = `# Each pushed branch is a preview of the tool; a deleted branch's preview goes (docs/lifecycle.md).
# Production takes the update of the production branch, from the tool's page in Forgeron.
# FORGERON_TOKEN: the token Forgeron gave when the tool was added from GitHub.
on:
  push:
    branches: ["**"]
  delete:
jobs:
  deploy:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@v4
      - uses: forgeron/deploy-action@v1 # name to be confirmed
        with:
          token: \${{ secrets.FORGERON_TOKEN }}
  close:
    if: github.event_name == 'delete' && github.event.ref_type == 'branch'
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@v4
      - uses: forgeron/deploy-action@v1 # name to be confirmed
        with:
          token: \${{ secrets.FORGERON_TOKEN }}
          close: "true"
          branch: \${{ github.event.ref }}
`;
