import {
  Badge,
  Button,
  Dialog,
  Field,
  Input,
  Notice,
  Page,
  SettingsGroup,
  SettingsRow,
} from "@forgeron/ui";
import { useState } from "react";
import { explain } from "../../../api";
import type { PageProps } from "../../../shell/page-props";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { disconnectGithub, loadGithub, newAppHref } from "../../tools/github";
import { SettingsStack } from "../components/settings-stack";

// Settings → GitHub (D-123): the workspace's own GitHub App. Not connected, an admin names the
// organisation (or none, for their account) and GitHub creates the app from Forgeron's manifest.
// Connected, the page shows the app and where it is installed, and links to install it elsewhere.

const OWNER = /^$|^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

export default function GithubPage({ api }: PageProps) {
  const github = useLoad(() => loadGithub(api), [api]);
  const [owner, setOwner] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();
  const query = new URLSearchParams(window.location.search);

  const disconnect = async () => {
    setBusy(true);
    setProblem(undefined);
    try {
      await disconnectGithub(api);
      setConfirming(false);
      github.reload();
    } catch (error) {
      setProblem(explain(error, "GitHub was not disconnected. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page
      title="GitHub"
      description="The workspace's GitHub App: its repositories deploy with no token to copy."
    >
      {github.loading ? (
        <Loading shape="list" label="Loading GitHub" />
      ) : !github.data ? (
        <LoadError what="GitHub" error={github.error} onRetry={github.reload} />
      ) : !github.data.app ? (
        <SettingsStack>
          {!github.data.available ? (
            <Notice tone="warning" title="Not available on this install">
              The gateway needs <span className="fc-mono">SECRETS_KEY</span> to keep the app&apos;s
              keys.
            </Notice>
          ) : null}
          <SettingsGroup
            title="Connect GitHub"
            description="GitHub creates an app for this workspace. Install it on an organisation, then add its repositories as tools, or have new ones made."
          >
            <div className="fc-stack" style={{ padding: "var(--space-4)" }}>
              <Field
                label="Organisation"
                hint="Where the app is created. Leave empty for your own account."
              >
                {(control) => (
                  <Input
                    {...control}
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="edicia-sh"
                    autoComplete="off"
                  />
                )}
              </Field>
              <div>
                <Button
                  variant="primary"
                  href={newAppHref(owner)}
                  aria-disabled={!github.data.available || !OWNER.test(owner.trim())}
                  onClick={(e: { preventDefault(): void }) => {
                    if (!github.data?.available || !OWNER.test(owner.trim())) e.preventDefault();
                  }}
                >
                  Create the GitHub App
                </Button>
              </div>
            </div>
          </SettingsGroup>
        </SettingsStack>
      ) : (
        <SettingsStack>
          {query.has("connected") ? (
            <Notice tone="success" title="The app is created">
              Install it on the organisations whose repositories hold tools.
            </Notice>
          ) : null}
          {query.has("installed") ? (
            <Notice tone="success" title="The app is installed">
              Its repositories can be added from the Tools page.
            </Notice>
          ) : null}
          <SettingsGroup title="The app">
            <SettingsRow label="Name" description={`Owned by ${github.data.app.owner}`}>
              <a
                className="fc-mono"
                href={github.data.app.htmlUrl}
                target="_blank"
                rel="noreferrer"
              >
                {github.data.app.slug}
              </a>
            </SettingsRow>
            <SettingsRow label="Created">
              <span className="fc-mono">{github.data.app.createdAt.slice(0, 10)}</span>
            </SettingsRow>
          </SettingsGroup>
          <SettingsGroup
            title="Installations"
            description="The organisations and accounts whose repositories the app may see."
          >
            {github.data.installations.length === 0 ? (
              <SettingsRow
                label="Not installed yet"
                description="Install it to see repositories."
              />
            ) : (
              github.data.installations.map((i) => (
                <SettingsRow key={i.id} label={i.account}>
                  <Badge>{i.accountType === "User" ? "Account" : "Organisation"}</Badge>
                </SettingsRow>
              ))
            )}
            <SettingsRow label="Install elsewhere" description="On GitHub, then back here.">
              <Button href={github.data.app.installUrl}>Install on GitHub</Button>
            </SettingsRow>
          </SettingsGroup>
          <SettingsGroup title="Disconnect" tone="danger">
            <SettingsRow
              label="Forget the app"
              description="Its keys are removed from Forgeron. Delete the app on GitHub too. Tools keep their repository."
            >
              <Button variant="danger" onClick={() => setConfirming(true)}>
                Disconnect
              </Button>
            </SettingsRow>
          </SettingsGroup>
        </SettingsStack>
      )}
      {confirming ? (
        <Dialog
          title="Disconnect GitHub?"
          description="Repositories stop deploying until a new app is connected or a token is given."
          onClose={() => !busy && setConfirming(false)}
          footer={
            <>
              <Button onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" onClick={disconnect} disabled={busy}>
                {busy ? "Disconnecting…" : "Disconnect"}
              </Button>
            </>
          }
        >
          {problem ? <Notice tone="danger">{problem}</Notice> : null}
        </Dialog>
      ) : null}
    </Page>
  );
}
