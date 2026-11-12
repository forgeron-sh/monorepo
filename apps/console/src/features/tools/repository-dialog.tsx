import {
  Badge,
  Button,
  Checkbox,
  CopyBlock,
  Dialog,
  Field,
  Input,
  Notice,
  Select,
} from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../api";
import { useLoad } from "../../use-load";
import { addRepositoryTool } from "./api";
import {
  createGithubTool,
  linkGithubRepository,
  loadGithub,
  loadGithubRepositories,
  toolNameOf,
  type GithubRepository,
} from "./github";

// Adding a tool from a GitHub repository (D-121): one repository, one tool. With the workspace's
// GitHub App (D-123), the repositories it may see are listed and one is linked in a click: its CI
// deploys with GitHub's identity, no token to copy. Without the app, Forgeron creates the tool with no
// environment and gives the token its CI deploys with, once. From then on each pushed branch is a
// preview, a deleted branch goes, and production takes the update of its production branch.

const NAME = /^[a-z][a-z0-9-]{0,39}$/;
const REPO = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;

/** With the app: the repositories it may see, else the dialog with a token. */
export function RepositoryDialog(props: { api: Api; onClose: () => void; onAdded: () => void }) {
  const github = useLoad(() => loadGithub(props.api).catch(() => undefined), [props.api]);
  const [byHand, setByHand] = useState(false);
  if (github.loading) return null;
  const connected = !!github.data?.app && github.data.installations.length > 0;
  return connected && !byHand ? (
    <AppRepositoryDialog {...props} onByHand={() => setByHand(true)} />
  ) : (
    <TokenRepositoryDialog {...props} />
  );
}

function AppRepositoryDialog({
  api,
  onClose,
  onAdded,
  onByHand,
}: {
  api: Api;
  onClose: () => void;
  onAdded: () => void;
  onByHand: () => void;
}) {
  const repositories = useLoad(() => loadGithubRepositories(api), [api]);
  const [chosen, setChosen] = useState<GithubRepository>();
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [addWorkflow, setAddWorkflow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [added, setAdded] = useState<{ tool: string; workflow: string }>();

  const choose = (repo: GithubRepository) => {
    setChosen(repo);
    setName(toolNameOf(repo.repo));
    setBranch(repo.defaultBranch);
  };
  const valid = !!chosen && NAME.test(name) && branch.trim() !== "";
  const submit = async () => {
    if (!chosen) return;
    setBusy(true);
    setError(undefined);
    try {
      const done = await linkGithubRepository(api, {
        repo: chosen.repo,
        name,
        productionBranch: branch.trim(),
        ...(chosen.workflow ? {} : { addWorkflow }),
      });
      setAdded({ tool: done.tool, workflow: done.workflow });
      onAdded();
    } catch (e) {
      setError(explain(e, "The tool was not added. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (added) {
    return (
      <Dialog
        title={`${added.tool} is added`}
        description="Push a branch: each branch becomes a preview. No token is needed."
        onClose={onClose}
        footer={
          <Button variant="primary" onClick={onClose} data-autofocus>
            Done
          </Button>
        }
      >
        {added.workflow === "missing" ? (
          <Notice tone="warning" title="The repository has no Forgeron workflow">
            Add <code>.github/workflows/forgeron.yml</code>, as <code>forgeron init</code> writes
            it, for its pushes to deploy.
          </Notice>
        ) : (
          <Notice tone="success" title="Its CI deploys with GitHub's identity">
            {added.workflow === "added"
              ? "The workflow was added to the repository."
              : "The repository already has its workflow."}
          </Notice>
        )}
      </Dialog>
    );
  }

  return (
    <Dialog
      title="Add a tool from GitHub"
      description="The repositories the workspace's GitHub App may see. Pick the one that holds the tool."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="ghost" onClick={onByHand} disabled={busy}>
            Use a token instead
          </Button>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !valid}>
            {busy ? "Adding…" : "Add"}
          </Button>
        </>
      }
    >
      {repositories.loading ? (
        <p className="fc-muted">Reading the repositories…</p>
      ) : !repositories.data ? (
        <Notice tone="danger">{explain(repositories.error, "GitHub could not be read.")}</Notice>
      ) : repositories.data.length === 0 ? (
        <Notice tone="info">
          The app sees no repository. Install it on more repositories from Settings, GitHub.
        </Notice>
      ) : (
        <ul className="ft-repos" role="listbox" aria-label="Repositories">
          {repositories.data.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected={chosen?.id === r.id}
                className={`ft-repo${chosen?.id === r.id ? " is-chosen" : ""}`}
                disabled={r.tool !== null}
                onClick={() => choose(r)}
              >
                <span className="fc-mono">{r.repo}</span>
                {r.tool ? (
                  <Badge>{`Linked to ${r.tool}`}</Badge>
                ) : r.forgeron ? (
                  <Badge tone="success">Forgeron tool</Badge>
                ) : (
                  <Badge>No forgeron.config.ts</Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {chosen ? (
        <>
          <Field label="Tool name" hint="As in its forgeron.config.ts: a-z, 0-9 and -">
            {(control) => (
              <Input
                {...control}
                mono
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Production branch" hint="Its updates are the ones production takes.">
            {(control) => (
              <Input
                {...control}
                mono
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                autoComplete="off"
              />
            )}
          </Field>
          {chosen.workflow ? null : (
            <Checkbox
              label="Add the Forgeron workflow to the repository"
              checked={addWorkflow}
              onChange={(e) => setAddWorkflow(e.target.checked)}
            />
          )}
        </>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

/**
 * "New tool" (D-123): a repository made in an organisation the app is installed on, with the files
 * `forgeron init` writes, linked to a new tool before its first push.
 */
export function NewToolDialog({
  api,
  onClose,
  onAdded,
}: {
  api: Api;
  onClose: () => void;
  onAdded: () => void;
}) {
  const github = useLoad(() => loadGithub(api), [api]);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [made, setMade] = useState<{ tool: string; repo: string; url: string }>();
  const owners = (github.data?.installations ?? []).filter((i) => i.accountType === "Organization");
  const target = owner || owners[0]?.account || "";
  const valid = NAME.test(name) && target !== "";

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      setMade(await createGithubTool(api, { name, owner: target }));
      onAdded();
    } catch (e) {
      setError(explain(e, "The tool was not made. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (made) {
    return (
      <Dialog
        title={`${made.tool} is made`}
        description="Its repository is pushed: its first preview shows up here in a few minutes."
        onClose={onClose}
        footer={
          <Button variant="primary" onClick={onClose} data-autofocus>
            Done
          </Button>
        }
      >
        <p>
          <a href={made.url} target="_blank" rel="noreferrer" className="fc-mono">
            {made.repo}
          </a>
        </p>
      </Dialog>
    );
  }

  return (
    <Dialog
      title="New tool"
      description="A new repository on GitHub, made as forgeron init would, and its tool here."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !valid}>
            {busy ? "Making…" : "Make"}
          </Button>
        </>
      }
    >
      {github.loading ? (
        <p className="fc-muted">Reading GitHub…</p>
      ) : owners.length === 0 ? (
        <Notice tone="info" title="Connect GitHub first">
          Create the workspace&apos;s GitHub App and install it on an organisation, in Settings,
          GitHub. GitHub lets an app make repositories in an organisation only.
        </Notice>
      ) : (
        <>
          <Field label="Tool name" hint="Also the repository's name: a-z, 0-9 and -">
            {(control) => (
              <Input
                {...control}
                mono
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                data-autofocus
              />
            )}
          </Field>
          <Field
            label="Organisation"
            hint="One the app is installed on. The repository is private."
          >
            {(control) => (
              <Select
                {...control}
                value={target}
                onChange={(e) => setOwner(e.target.value)}
                options={owners.map((o) => ({ value: o.account, label: o.account }))}
              />
            )}
          </Field>
        </>
      )}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

function TokenRepositoryDialog({
  api,
  onClose,
  onAdded,
}: {
  api: Api;
  onClose: () => void;
  /** The tool exists: the list reads it again. */
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [added, setAdded] = useState<{ tool: string; token: string; expiresAt: string }>();

  const valid = NAME.test(name) && REPO.test(repo.trim()) && branch.trim() !== "";
  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const done = await addRepositoryTool(api, {
        name,
        repo: repo.trim(),
        productionBranch: branch.trim(),
      });
      setAdded({ tool: done.tool, token: done.token, expiresAt: done.expiresAt });
      onAdded();
    } catch (e) {
      setError(explain(e, "The tool was not added. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (added) {
    return (
      <Dialog
        title={`${added.tool} is added`}
        description="Give its repository the token below, then push: each branch becomes a preview."
        onClose={onClose}
        footer={
          <Button variant="primary" onClick={onClose} data-autofocus>
            Done
          </Button>
        }
      >
        <div className="fc-stack">
          <Notice tone="warning" title="The token is shown once.">
            Copy it now. It expires on {added.expiresAt.slice(0, 10)}.
          </Notice>
          <CopyBlock label="FORGERON_TOKEN" value={added.token} />
          <ol className="ft-steps">
            <li>
              In the repository on GitHub, add it as the secret <code>FORGERON_TOKEN</code>{" "}
              (Settings, Secrets and variables, Actions).
            </li>
            <li>
              Add the workflow that <code>forgeron init</code> writes,{" "}
              <code>.github/workflows/forgeron.yml</code>, if the repository has none.
            </li>
            <li>
              Push a branch. When <code>{branch}</code> has a preview, its update shows on the
              tool&apos;s page, under Branches.
            </li>
          </ol>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title="Add a tool from GitHub"
      description="A repository that holds one tool. Its CI builds each push; Forgeron serves each branch as a preview."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !valid}>
            {busy ? "Adding…" : "Add"}
          </Button>
        </>
      }
    >
      <Field label="Tool name" hint="As in its forgeron.config.ts: a-z, 0-9 and -">
        {(control) => (
          <Input
            {...control}
            mono
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            data-autofocus
          />
        )}
      </Field>
      <Field label="Repository" hint="owner/name, for example edicia-sh/odoo">
        {(control) => (
          <Input
            {...control}
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/name"
            autoComplete="off"
          />
        )}
      </Field>
      <Field label="Production branch" hint="Its updates are the ones production takes.">
        {(control) => (
          <Input
            {...control}
            mono
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            autoComplete="off"
          />
        )}
      </Field>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}
