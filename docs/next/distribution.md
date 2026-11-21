# Target — how a tool reaches a workspace

> Status: proposal (21 November 2026), from the owner's answer on D7. It extends the catalog and marketplaces that exist (D-116) and does not replace them.

A catalog holds finished tools: ours, and those of the marketplaces a workspace has added. A workspace takes a tool from it in one of two ways, offered as two buttons on the tool's page.

|                    | Add                                                  | Fork                                                         |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| What happens       | the published tool is installed as it is             | the tool's source is written into the workspace's repository |
| Who owns the code  | its maintainers                                      | the workspace                                                |
| Can be changed     | by its settings, its custom fields and its plugins   | entirely                                                     |
| Updates            | applied by the platform when the maintainers release | proposed as a pull request, merged by the team               |
| Needs a repository | no                                                   | yes                                                          |
| Exists today       | yes (marketplace install, D-116)                     | no                                                           |

A workspace may start with Add and fork later; the data stays, since the fork begins at the same version.

## Fork, step by step

1. The person presses **Fork** on the tool's page, or runs `forgeron add tool crm --from forgeron/crm`.
2. The platform, through the workspace's GitHub App (D-123), opens a pull request on the workspace repository. It writes the tool's source under `tools/<name>/`, as the repository's layout prescribes ([framework](framework.md), section 1), and records the origin in `.forgeron/origins.json`: catalog, tool, version, commit.
3. The pull request's own checks run (`forgeron check`), and the branch gets its preview as any branch does.
4. Merging it deploys the tool. If the tool was already installed by Add, the deployment takes over the same tool and the same data.

With no repository connected yet, the same button first creates the workspace repository from the template, then opens the pull request.

The layout being fixed is what makes this possible: the platform knows where a tool goes and what else must change (the workspace's package list, the generated types), so the pull request is complete and the same every time.

## Staying up to date after a fork

A forked tool has diverged on purpose. An update is therefore a merge, and it is proposed, never applied.

1. When the origin releases, the platform notes it on the tool's page: version, changelog, and the manifest diff with its semver impact, which exists today.
2. **Update** (or `forgeron update crm`) opens a pull request: a three-way merge between the origin's old version, its new version and the workspace's code.
3. Where the merge is clean, the pull request is ready. Where it conflicts, an agent resolves it with the origin's changelog and the tool's tests as its guide, and says in the pull request what it decided and what it could not.
4. The team reviews and merges, or closes it and stays where it is. Skipping versions is allowed.

What keeps merges small:

- **Customise through the narrow paths first.** A custom field, a plugin or a recipe-added file does not touch the origin's files, so it never conflicts.
- **Recipes record intent.** A change made by a recipe can be replayed on the new version instead of merged.
- **One model per file, one action per file.** Conflicts stay local to what both sides really changed.

## Publishing

- A workspace may offer its own tools to others by making its repository, or a part of it, a marketplace (D-116).
- Our catalog is the `tools/` directory of this repository, released tool by tool (`crm@1.2.0`).

## Open questions

| Question                                                                            | Recommendation                                                             |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Does a fork keep the tool's name, or may two forks of one origin coexist            | keep the name by default; a second fork takes a new name                   |
| Who runs the merge agent: the platform, or the team's own agent through the harness | the team's own, from a skill; the platform only opens the pull request     |
| Hosts other than GitHub                                                             | later; the CLI path (`forgeron add tool --from`) works anywhere            |
| Licence of a forked tool                                                            | the origin's; ours are Apache-2.0 (D-085), so a fork is the team's to keep |
