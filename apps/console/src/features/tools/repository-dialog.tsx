import { Button, CopyBlock, Dialog, Field, Input, Notice } from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../api";
import { addRepositoryTool } from "./api";

// Adding a tool from a GitHub repository (D-121): one repository, one tool. Forgeron creates the tool
// with no environment and gives the token its CI deploys with, once. From then on each pushed branch
// is a preview, a deleted branch goes, and production takes the update of its production branch.

const NAME = /^[a-z][a-z0-9-]{0,39}$/;
const REPO = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;

export function RepositoryDialog({
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
