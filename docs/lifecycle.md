# The life of a tool

How a Forgeron tool goes from code to the people who use it (D-121). Read it before changing a tool, its releases or its CI. `forgeron init` copies this file into every new repository, so that an agent working there knows it too.

## Two ways in

|                      | Marketplace                                                                          | Repository                                                   |
| -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| What it is           | A GitHub repository of finished tools (`tools/<name>/`, `forgeron-marketplace.json`) | A GitHub repository that holds **one** tool                  |
| Made with            | `forgeron init marketplace`, then `forgeron init <name>` inside it                   | `forgeron init <name>`                                       |
| What Forgeron takes  | The latest release of each tool, from its GitHub Release                             | Every pushed branch, built by the repository's CI            |
| In a workspace       | An admin installs the tool, then updates it when a newer release comes               | An admin adds the tool from GitHub; each branch is a preview |
| Branches in Forgeron | None                                                                                 | One per pushed branch                                        |

A tool comes from one place in a workspace: a marketplace or a repository, not both.

## Builds, releases, versions

- **Forgeron builds nothing.** The CI of the repository builds, tests and sends the build (`forgeron deploy`, or `forgeron bundle` for a marketplace).
- **A build** is one push. In a repository tool it becomes a version named after its branch and commit (`1.4.0-preview.<branch>+<hash>`).
- **A release** is a build with a number and a changelog. It is made by declaring what changed, then releasing:

  ```sh
  forgeron change --type added --bump minor -m "Tickets by team"   # one file in changes/
  forgeron release                                                 # version, CHANGELOG.md, commit, tag <tool>@<version>
  git push --follow-tags                                           # forgeron release does not push
  ```

- **Release on the production branch only.** `forgeron release` consumes `changes/`. Run it on `main` (or the tool's production branch), never on another branch: two branches would both number `1.3.0`, and their changelogs would conflict at the merge. Other branches keep their `changes/` files until they are merged.
- **A release is advised, not required.** An admin may put a build with no release in production, knowingly: its users are then not told what changes. A release that declares less than what changed (`forgeron change check`) is refused.

## Branches (repository tools)

- **Push a branch, get a preview.** Its own Worker, its own database, filled by the tool's seed or left empty (`preview.data`). Nothing is copied from production.
- **Delete the branch, the preview goes**, with its database.
- **The production branch** (`main` unless the admin chose another) is the candidate for production. Its preview is what an update puts in production.
- **Data between branches.** A new branch starts with no data. An admin may replace a branch's data by another branch's (the Database tab of the branch). Production's data is never copied, and never replaced.
- **Pilots.** An admin may open a branch to some people: they add it to their library as a tool of its own, with its own data (D-119).

## Updates

- **A marketplace tool** shows an update when the marketplace publishes a newer release. **A repository tool** shows one when the preview of its production branch serves another version than production.
- **The admin updates from the tool's page** (Branches). The update says what it brings (its changelog) and what it asks for that production does not have (a new network address, a secret, a connector). The admin approves it there, in the same step: there is no separate screen of approvals.
- **Update by itself.** A tool can take its updates on its own. A new version that asks for nothing new, and is a release, goes to production by itself. The others wait for the admin on the tool's page.
- **The people who added the tool get production's version at their next call**, with nothing to do. A preview never reaches them unless it is promoted.

## What an agent should do in a tool's repository

- Change the code, then `forgeron test`.
- Describe the change with `forgeron change`. Check it with `forgeron change check` (CI runs it too).
- On the production branch, when the change is ready for the people who use the tool: `forgeron release`, then push the commit and the tag.
- Never put a real secret in the repository, its tests or its fixtures: secrets are set with `forgeron secrets set`.
- `README.md` is for admins (technical); `GUIDE.md` is for the people who use the tool, with no technical term.
