import { Button, CopyBlock, Dialog, Markdown, Menu, Notice, Page, Tabs } from "@forgeron/ui";
import { ToolIcon } from "../tools/components";
import { useState, type ReactNode } from "react";
import { explain, type Api } from "../../api";
import { pathOf, routeClick, toolPath } from "../../router";
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
import "../tools/tools.css";
import "./portal.css";

// A tool as the person who uses it sees it (D-118): what it does (its guide), adding it to their
// library, finishing what it asks of them, how to use it (on the web, in Claude, in a terminal), and
// removing it. No version, role, action, resource or README: those are the admin's sheet.

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

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
  if (!mcp && !cli) {
    return (
      <p className="fc-muted">
        {web
          ? `Use ${card.title} in your browser: open it with the button above.`
          : "There is nothing to open for this tool yet."}
      </p>
    );
  }
  return (
    <div className="fp-connect">
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

  const title = c.pilot ? `${c.title} · ${channelLabel(c.pilot)}` : c.title;
  const web = c.use.web;
  const entries =
    c.installed && c.managed
      ? [
          {
            kind: "action" as const,
            label: "Remove from my tools",
            tone: "danger" as const,
            onSelect: () => setRemoving(true),
          },
        ]
      : [];
  const primary = !c.installed ? (
    <Button variant="primary" onClick={add} disabled={busy}>
      {busy ? "Adding…" : "Add to my tools"}
    </Button>
  ) : c.setupUrl ? (
    <Button variant="primary" href={c.setupUrl}>
      Finish setup
    </Button>
  ) : ready && web ? (
    <Button variant="primary" href={web.url}>
      Open {c.title}
    </Button>
  ) : null;

  return (
    <main className="fg-page ft-page">
      <a className="fp-back" href={pathOf("myTools")} onClick={routeClick(go)}>
        <span aria-hidden="true">←</span> My tools
      </a>
      <header className="ft-header">
        <ToolIcon name={c.title} size={48} />
        <div className="ft-header-text">
          <div className="ft-header-title">
            <h1 className="fg-page-title">{title}</h1>
          </div>
          <p className="fg-page-desc">{c.summary}</p>
        </div>
        <div className="ft-header-actions">
          {primary || entries.length ? (
            <span className="ft-split">
              {primary}
              {entries.length ? (
                <Menu
                  className={`ft-split-menu${primary ? " ft-split-primary" : ""}`}
                  label="More actions"
                  trigger={<Chevron />}
                  entries={entries}
                />
              ) : null}
            </span>
          ) : null}
        </div>
      </header>
      <div className="fp-card">
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
    </main>
  );
}
