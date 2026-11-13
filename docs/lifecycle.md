# The life of a tool

How a Forgeron tool goes from code to the people who use it (D-121, D-125). Read it before changing a tool, its releases or its CI. `forgeron init` copies this file into every new repository, so that an agent working there knows it too.

## Two words

- **A branch** (GitHub) is where people work. Git is the versioning and the history. GitHub is the source of truth: Forgeron never moves code from one branch to another.
- **A channel** (Forgeron) is where a tool is distributed. Each channel has its own data (its own database) and its own access rule.

## Two ways in

|                     | Marketplace                                                                          | Repository                                             |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| What it is          | A GitHub repository of finished tools (`tools/<name>/`, `forgeron-marketplace.json`) | A GitHub repository that holds **one** tool            |
| Made with           | `forgeron init marketplace`, then `forgeron init <name>` inside it                   | `forgeron init <name>`                                 |
| What Forgeron takes | The latest release of each tool, from its GitHub Release                             | Every pushed branch, built by the repository's CI      |
| In a workspace      | An admin installs the tool, then updates it when a newer release comes               | An admin adds the tool from GitHub                     |
| Channels            | Production, and the permanent channels an admin adds                                 | The same, plus one temporary channel per pushed branch |

A tool comes from one place in a workspace: a marketplace or a repository, not both.

## Channels

- **Production** always exists and is unique. It answers at `/t/<tool>/`.
- **Other permanent channels** (`staging`, `recette`…) are added by an admin on the tool's page. They answer at `/t/<tool>~<name>/`.
- **A permanent channel follows one branch** (production follows `main`, unless the admin chose another) and takes **only the releases** of that branch. A build that is not a release never reaches it.
- **A temporary channel** is made by each pushed branch and removed when the branch is deleted. It takes every push, with no version needed. It answers at `/t/<tool>@<branch>/` and shows the branch's commits.
- **Access**: who may use a channel is its publication, set in the header of the tool's page (D-129). A channel is a **draft** until someone who can publish it does: only people who manage access use it, and those who hold `tools:read` too on a branch's temporary channel. **Published**, it is shared with everyone, some teams or some people. What each of them may do in the tool is the Access tab: Everyone and each team are given one of the tool's profiles (D-127, D-137). Every person of the workspace is part of Everyone without being given it, so a person in no team gets what the tool gives Everyone (its default profile, unless an admin changed it), on a channel they may use and nowhere else. Who can make a temporary channel is who can push to the repository: Forgeron makes no branch.

## Builds, releases, versions

- **Forgeron builds nothing.** The CI of the repository builds, tests and sends the build (`forgeron deploy`, or `forgeron bundle` for a marketplace).
- **A build** is one push. It goes to its branch's temporary channel, as a version named after its branch and commit (`1.4.0-preview.<branch>+<hash>`).
- **A release** is a build with a number and a changelog. It is made by declaring what changed, then releasing, on the branch a permanent channel follows:

  ```sh
  forgeron change --type added --bump minor -m "Tickets by team"   # one file in changes/
  forgeron release                                                 # version, CHANGELOG.md, commit, tag <tool>@<version>
  git push --follow-tags                                           # forgeron release does not push
  ```

- **Release on the branch the channel follows.** `forgeron release` consumes `changes/`. Run it on `main` for production (or on `staging` for a channel that follows `staging`). Two branches that release on their own number the same version and conflict at the merge: merge first, then release.
- **A release is required** for a permanent channel. A build whose `changes/` still wait for `forgeron release` is not a release. A release that declares less than what changed (`forgeron change check`) is refused.
- **Pre-releases** (`1.3.0-rc.1`) are not supported: `forgeron release` numbers `x.y.z` only.

## Branches (repository tools)

- **Push a branch, get a temporary channel.** Its own Worker, its own database, filled by the tool's seed or left empty (`preview.data`). Nothing is copied from a permanent channel.
- **No token in the repository.** The workflow (`.github/workflows/forgeron.yml`) has `id-token: write`: GitHub tells Forgeron which repository runs, and Forgeron deploys the tool linked to it (D-123). A tool is linked when an admin adds it from GitHub, or makes it with "New tool".
- **Delete the branch, its channel goes**, with its database.
- **Data between branches.** A new branch starts with no data. An admin may replace a branch's data by another branch's (the Database tab of the branch). A permanent channel's data is never copied, and never replaced.

## Updates

- **A marketplace tool** shows an update when the marketplace publishes a newer release. **A repository tool** shows one on a permanent channel when the branch it follows has a newer release than the channel serves.
- **The admin updates a channel from the tool's page** (Channels). The update says what it brings (its changelog) and what it asks for that production does not have (a new network address, a secret, a connector). The admin approves it there, in the same step: there is no separate screen of approvals.
- **Update by itself.** Each permanent channel can take its releases on its own. A release that asks for nothing new goes by itself; the others wait for the admin on the tool's page.
- **Roll back.** A permanent channel can go back to a release it served before: no new code, no migration undone.
- **The people who added the tool get the channel's version at their next call**, with nothing to do.
- **There is no promotion.** To bring a change to production, merge it in Git into the branch production follows, then release there.

## What an agent should do in a tool's repository

- Change the code, then `forgeron test`.
- Describe the change with `forgeron change`. Check it with `forgeron change check` (CI runs it too).
- On the branch a permanent channel follows, when the change is ready for the people who use the tool: `forgeron release`, then push the commit and the tag.
- Never put a real secret in the repository, its tests or its fixtures: secrets are set with `forgeron secrets set`.
- `README.md` is for admins (technical); `GUIDE.md` is for the people who use the tool, with no technical term.
