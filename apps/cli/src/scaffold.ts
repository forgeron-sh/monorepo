// What `forgeron init` writes for an agent and a person to know how a tool lives (D-121): the
// lifecycle (a copy of docs/lifecycle.md, kept identical by a test), the AGENTS.md of a tool's
// repository and of a marketplace, and CLAUDE.md, which points to AGENTS.md instead of copying it.

export const LIFECYCLE_PATH = "docs/lifecycle.md";

/** docs/lifecycle.md of the Forgeron repository, as it was when this CLI was built. */
export const LIFECYCLE =
  "# The life of a tool\n\nHow a Forgeron tool goes from code to the people who use it (D-121). Read it before changing a tool, its releases or its CI. `forgeron init` copies this file into every new repository, so that an agent working there knows it too.\n\n## Two ways in\n\n|                      | Marketplace                                                                          | Repository                                                   |\n| -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |\n| What it is           | A GitHub repository of finished tools (`tools/<name>/`, `forgeron-marketplace.json`) | A GitHub repository that holds **one** tool                  |\n| Made with            | `forgeron init marketplace`, then `forgeron init <name>` inside it                   | `forgeron init <name>`                                       |\n| What Forgeron takes  | The latest release of each tool, from its GitHub Release                             | Every pushed branch, built by the repository's CI            |\n| In a workspace       | An admin installs the tool, then updates it when a newer release comes               | An admin adds the tool from GitHub; each branch is a preview |\n| Branches in Forgeron | None                                                                                 | One per pushed branch                                        |\n\nA tool comes from one place in a workspace: a marketplace or a repository, not both.\n\n## Builds, releases, versions\n\n- **Forgeron builds nothing.** The CI of the repository builds, tests and sends the build (`forgeron deploy`, or `forgeron bundle` for a marketplace).\n- **A build** is one push. In a repository tool it becomes a version named after its branch and commit (`1.4.0-preview.<branch>+<hash>`).\n- **A release** is a build with a number and a changelog. It is made by declaring what changed, then releasing:\n\n  ```sh\n  forgeron change --type added --bump minor -m \"Tickets by team\"   # one file in changes/\n  forgeron release                                                 # version, CHANGELOG.md, commit, tag <tool>@<version>\n  git push --follow-tags                                           # forgeron release does not push\n  ```\n\n- **Release on the production branch only.** `forgeron release` consumes `changes/`. Run it on `main` (or the tool's production branch), never on another branch: two branches would both number `1.3.0`, and their changelogs would conflict at the merge. Other branches keep their `changes/` files until they are merged.\n- **A release is advised, not required.** An admin may put a build with no release in production, knowingly: its users are then not told what changes. A release that declares less than what changed (`forgeron change check`) is refused.\n\n## Branches (repository tools)\n\n- **Push a branch, get a preview.** Its own Worker, its own database, filled by the tool's seed or left empty (`preview.data`). Nothing is copied from production.\n- **Delete the branch, the preview goes**, with its database.\n- **The production branch** (`main` unless the admin chose another) is the candidate for production. Its preview is what an update puts in production.\n- **Data between branches.** A new branch starts with no data. An admin may replace a branch's data by another branch's (the Database tab of the branch). Production's data is never copied, and never replaced.\n- **Pilots.** An admin may open a branch to some people: they add it to their library as a tool of its own, with its own data (D-119).\n\n## Updates\n\n- **A marketplace tool** shows an update when the marketplace publishes a newer release. **A repository tool** shows one when the preview of its production branch serves another version than production.\n- **The admin updates from the tool's page** (Branches). The update says what it brings (its changelog) and what it asks for that production does not have (a new network address, a secret, a connector). The admin approves it there, in the same step: there is no separate screen of approvals.\n- **Update by itself.** A tool can take its updates on its own. A new version that asks for nothing new, and is a release, goes to production by itself. The others wait for the admin on the tool's page.\n- **The people who added the tool get production's version at their next call**, with nothing to do. A preview never reaches them unless it is promoted.\n\n## What an agent should do in a tool's repository\n\n- Change the code, then `forgeron test`.\n- Describe the change with `forgeron change`. Check it with `forgeron change check` (CI runs it too).\n- On the production branch, when the change is ready for the people who use the tool: `forgeron release`, then push the commit and the tag.\n- Never put a real secret in the repository, its tests or its fixtures: secrets are set with `forgeron secrets set`.\n- `README.md` is for admins (technical); `GUIDE.md` is for the people who use the tool, with no technical term.\n";

/** Claude Code reads CLAUDE.md; it imports AGENTS.md, which every other agent reads. */
export const CLAUDE_MD = "@AGENTS.md\n";

export const toolAgents = (name: string) => `# ${name}

A Forgeron tool, alone in its repository. Read [docs/lifecycle.md](docs/lifecycle.md) first: how a
push becomes a preview, what a release is, and how production is updated.

## Commands

- \`forgeron dev\`: run it locally. \`forgeron test\`: build it and run its tests.
- \`forgeron change --type <added|changed|fixed|removed|security> --bump <patch|minor|major> -m "..."\`:
  describe a change, in the same commit as the change.
- \`forgeron release\`: on the production branch only, when the change is ready for its users. Then
  \`git push --follow-tags\`.

## Rules

- Every push of a branch deploys a preview of it (\`.github/workflows/forgeron.yml\`); deleting the
  branch removes it. Nothing reaches production without an admin, or the tool's own "update by itself".
- \`README.md\` is for admins and may be technical; \`GUIDE.md\` is for the people who use the tool,
  with no technical term.
- No real secret in the repository, its tests or its fixtures.
`;

export const marketplaceAgents = (name: string) => `# ${name}

A Forgeron marketplace: finished tools, one per folder of \`tools/\`, published as GitHub Releases
and listed in \`forgeron-marketplace.json\`. Read [docs/lifecycle.md](docs/lifecycle.md) first.

## Commands

- \`forgeron init <name>\` at the root: a new tool in \`tools/<name>/\`, listed in the index.
- In \`tools/<name>/\`: \`forgeron test\`, \`forgeron change ...\`, then \`forgeron release\` on \`main\`
  and \`git push --follow-tags\`. The tag \`<name>@<version>\` runs \`.github/workflows/release.yml\`:
  it tests, bundles, attaches the bundle to the release and updates the index.

## Rules

- A workspace installs the latest release of each tool and updates it when a newer one is published:
  a release is what its users get.
- \`README.md\` is for admins and may be technical; \`GUIDE.md\` is for the people who use the tool,
  with no technical term.
- No real secret in the repository, its tests or its fixtures.
`;

export const MARKETPLACE_INDEX_PATH = "forgeron-marketplace.json";
export const RELEASE_WORKFLOW_PATH = ".github/workflows/release.yml";

/** Publishes a tool on a tag \`<tool>@<version>\` (written by \`forgeron release\`). */
export const RELEASE_WORKFLOW = `# Publishes a tool of this marketplace on a tag <tool>@<version>, written by \`forgeron release\`:
# tests it, bundles it, attaches the bundle to the tag's release and updates forgeron-marketplace.json.
name: release
on:
  push:
    tags: ["*@*"]
permissions:
  contents: write
concurrency: marketplace-index
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: The tool and version of the tag
        id: tag
        run: |
          tag="\${GITHUB_REF_NAME}"
          echo "tool=\${tag%@*}" >> "$GITHUB_OUTPUT"
          echo "version=\${tag#*@}" >> "$GITHUB_OUTPUT"
      # The code of the tag, as it was released.
      - uses: actions/checkout@v4
        with: { ref: "\${{ github.ref }}" }
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - name: Test and bundle
        working-directory: tools/\${{ steps.tag.outputs.tool }}
        run: |
          bunx forgeron test
          bunx forgeron bundle --out "$RUNNER_TEMP/bundle"
      - name: Attach the bundle to the release
        env:
          GH_TOKEN: \${{ github.token }}
          TOOL: \${{ steps.tag.outputs.tool }}
          VERSION: \${{ steps.tag.outputs.version }}
        run: |
          file="$RUNNER_TEMP/bundle/$TOOL-$VERSION.forgeron.json"
          gh release view "$GITHUB_REF_NAME" >/dev/null 2>&1 || gh release create "$GITHUB_REF_NAME" --title "$GITHUB_REF_NAME" --notes "See the tool's CHANGELOG.md."
          gh release upload "$GITHUB_REF_NAME" "$file" --clobber
          echo "SHA=$(sha256sum "$file" | cut -d' ' -f1)" >> "$GITHUB_ENV"
      # The index lives on main: checked out apart, so the tag's files are left as they are.
      - uses: actions/checkout@v4
        with: { ref: main, path: index }
      - name: Update the index
        working-directory: index
        env:
          TOOL: \${{ steps.tag.outputs.tool }}
          VERSION: \${{ steps.tag.outputs.version }}
        run: |
          jq --arg t "$TOOL" --arg v "$VERSION" --arg r "$GITHUB_REF_NAME" --arg a "$TOOL-$VERSION.forgeron.json" --arg s "$SHA" \\
            '.tools |= map(if .name == $t then .version = $v | .release = $r | .asset = $a | .sha256 = $s else . end)' \\
            forgeron-marketplace.json > index.json && mv index.json forgeron-marketplace.json
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git commit -am "chore(marketplace): $GITHUB_REF_NAME" && git push origin main
`;
