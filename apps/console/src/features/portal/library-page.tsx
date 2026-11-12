import { Button, CopyBlock, Dialog, Markdown, Notice, Page, Tabs, ToolIcon } from "@forgeron/ui";
import { useState, type ReactNode } from "react";
import { explain, type Api } from "../../api";
import { pathOf, toolPath } from "../../router";
import { Loading, LoadError } from "../../states";
import { useLoad } from "../../use-load";
import {
  addPilot,
  addToLibrary,
  channelLabel,
  loadLibraryCard,
  loadPilotCard,
  removeFromLibrary,
  removePilot,
  type LibraryCard,
} from "./library";
import "./portal.css";

// A tool as the person who uses it sees it (D-118): what it does (its guide), adding it to their
// library, finishing what it asks of them, how to use it (on the web, in Claude, in a terminal), and
// removing it. No version, role, action, resource or README: those are the admin's sheet.

const Step = ({ n, children }: { n: number; children: ReactNode }) => (
  <li className="fp-step">
    <span className="fp-step-n" aria-hidden="true">
      {n}
    </span>
    <div>{children}</div>
  </li>
);

function Use({ card }: { card: LibraryCard }) {
  const { web, mcp, cli } = card.use;
  if (!web && !mcp && !cli) {
    return <p className="fc-muted">There is nothing to open for this tool yet.</p>;
  }
  return (
    <div className="fp-connect">
      {web ? (
        <section aria-labelledby="use-web">
          <h3 id="use-web" className="fp-h3">
            In your browser
          </h3>
          <Button variant="primary" href={web.url}>
            Open {card.title}
          </Button>
        </section>
      ) : null}
      {mcp ? (
        <section aria-labelledby="use-claude">
          <h3 id="use-claude" className="fp-h3">
            In Claude
          </h3>
          <ol className="fp-steps">
            <Step n={1}>In Claude, open Settings, then Connectors.</Step>
            <Step n={2}>
              Choose Add custom connector and paste this address.
              <CopyBlock label={`${card.title} address for Claude`} value={mcp.url} />
            </Step>
            <Step n={3}>Sign in with your work account when Claude asks, then allow access.</Step>
            <Step n={4}>Ask Claude for what you need: it knows what {card.title} can do.</Step>
          </ol>
        </section>
      ) : null}
      {cli ? (
        <section aria-labelledby="use-terminal">
          <h3 id="use-terminal" className="fp-h3">
            In a terminal
          </h3>
          <ol className="fp-steps">
            <Step n={1}>
              Sign in once.
              <CopyBlock label="Sign in from your terminal" value="forgeron login" prefix="$" />
            </Step>
            <Step n={2}>
              Then see what you can do.
              <CopyBlock label={`${card.title} command`} value={cli.command} prefix="$" />
            </Step>
          </ol>
        </section>
      ) : null}
    </div>
  );
}

export function LibraryToolPage({
  api,
  go,
  tool,
  pilot,
  admin = false,
}: {
  api: Api;
  go: (href: string) => void;
  tool: string;
  /** The person is an admin: they set who may use the tool, so they are never told to ask one. */
  admin?: boolean;
  /** A branch being tried (D-119): the page is that pilot's, not the tool's. */
  pilot?: string;
}) {
  const card = useLoad(
    () =>
      pilot ? loadPilotCard(api.fetchJson, tool, pilot) : loadLibraryCard(api.fetchJson, tool),
    [api, tool, pilot],
  );
  const [tab, setTab] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string>();

  if (card.loading && !card.data) return <Loading shape="page" label="Loading the tool" />;
  if (!card.data) {
    return (
      <Page title="Tool">
        <LoadError what="This tool" error={card.error} onRetry={card.reload} />
      </Page>
    );
  }
  const c = card.data;
  const ready = c.installed && !c.needsSetup;
  const shown = tab ?? (ready ? "use" : "about");

  const add = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const done = pilot
        ? await addPilot(api.sendJson, c.name, pilot)
        : await addToLibrary(api.sendJson, c.name);
      // The setup page is the gateway's: a full page load, which comes back here when it is done.
      if (done.setupUrl) window.location.assign(done.setupUrl);
      else {
        setTab("use");
        card.reload();
      }
    } catch (e) {
      setError(explain(e, `${c.title} could not be added. Try again.`));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (pilot) await removePilot(api.sendJson, c.name, pilot);
      else await removeFromLibrary(api.sendJson, c.name);
      go(pathOf("myTools"));
    } catch (e) {
      setError(explain(e, `${c.title} could not be removed. Try again.`));
      setBusy(false);
      setRemoving(false);
    }
  };

  return (
    <Page
      title={c.pilot ? `${c.title} · ${channelLabel(c.pilot)}` : c.title}
      description={
        <button type="button" className="fp-link" onClick={() => go(pathOf("myTools"))}>
          Back to my tools
        </button>
      }
      actions={
        !c.installed ? (
          <Button variant="primary" onClick={add} disabled={busy}>
            {busy ? "Adding…" : "Add to my tools"}
          </Button>
        ) : c.setupUrl ? (
          <Button variant="primary" href={c.setupUrl}>
            Finish setup
          </Button>
        ) : null
      }
    >
      <div className="fp-card">
        <div className="fp-card-head">
          <ToolIcon name={c.title} size="lg" />
          <div className="fp-card-titles">
            <p className="fp-card-summary">{c.summary}</p>
          </div>
        </div>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {c.pilot ? (
          <Notice tone="info" title={channelLabel(c.pilot)}>
            {c.pilot.startsWith("~")
              ? `A channel of ${c.title} apart from production, opened to you.`
              : `A version of ${c.title} being prepared, for you to try.`}{" "}
            It has its own data: nothing you do here reaches the {c.title} everyone uses, and
            nothing comes from it.
          </Notice>
        ) : null}
        {c.installed && !c.allowed ? (
          // What a role may do in a tool is the Access tab's (D-127): an admin sets it there.
          <Notice tone="info" title="Your roles do not let you use this tool yet.">
            {admin ? (
              <>
                Give one of your roles a profile in the{" "}
                <a href={`${toolPath(c.name)}?tab=access`}>Access</a> tab of {c.title}.
              </>
            ) : (
              <>Ask an admin of this workspace to give your role access to {c.title}.</>
            )}
          </Notice>
        ) : null}
        {c.installed && c.needsSetup ? (
          <Notice tone="warning" title="One step left">
            {c.title} needs something from you before it works, such as your own key. It is kept for
            you only.
          </Notice>
        ) : null}
        <Tabs
          label={`About ${c.title}`}
          tabs={[
            { id: "about", label: "About" },
            ...(ready ? [{ id: "use", label: "Use it" }] : []),
          ]}
          value={shown}
          onChange={setTab}
        >
          {shown === "use" && ready ? (
            <Use card={c} />
          ) : c.guide ? (
            <Markdown source={c.guide} images={c.images} />
          ) : (
            <p>{c.summary}</p>
          )}
        </Tabs>
        {c.installed && c.managed ? (
          <section className="fc-section" aria-labelledby="remove-title">
            <h2 id="remove-title" className="fc-section-title">
              Remove from my tools
            </h2>
            <p className="fc-section-hint">
              You can add it again later. Your saved keys stay in your secrets.
            </p>
            <div>
              <Button variant="danger" onClick={() => setRemoving(true)} disabled={busy}>
                Remove
              </Button>
            </div>
          </section>
        ) : null}
      </div>
      {removing ? (
        <Dialog
          title={`Remove ${c.title}?`}
          description={`${c.title} stops working for you, in Claude and everywhere else. What you gave it is forgotten; your saved keys stay in your secrets.`}
          onClose={() => !busy && setRemoving(false)}
          footer={
            <>
              <Button onClick={() => setRemoving(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" onClick={remove} disabled={busy} data-autofocus>
                {busy ? "Removing…" : "Remove"}
              </Button>
            </>
          }
        />
      ) : null}
    </Page>
  );
}
