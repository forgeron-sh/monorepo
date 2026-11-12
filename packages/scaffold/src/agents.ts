// What a new repository says to an agent and a person about how its tools live (D-121): the AGENTS.md
// of a tool's repository and of a marketplace, and CLAUDE.md, which points to AGENTS.md.

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
