import {
  Badge,
  Button,
  Checkbox,
  DetailList,
  Dialog,
  Markdown,
  Notice,
  Page,
  Tabs,
  ToolIcon,
} from "@forgeron/ui";
import { useState, type ReactNode } from "react";
import { explain } from "../../../api";
import { pathOf, toolPath } from "../../../router";
import type { PageProps } from "../../../shell/page-props";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { installMarketplaceTool, loadMarketplaceToolCard, type MarketplaceToolCard } from "../api";
import "../../portal/portal.css";
import "../marketplace.css";

// The technical sheet of a tool in a marketplace (D-116), for the admin who decides to install it:
// the README, the guide its users will read, and everything the tool asks of the workspace. Installing
// creates the tool with its requests for resources pending; nothing runs until it is promoted.

const NO_IMAGES = {};

const list = (items: ReactNode[], empty = "None") =>
  items.length === 0 ? (
    empty
  ) : (
    <ul className="fm-list">
      {items.map((i, n) => (
        <li key={n}>{i}</li>
      ))}
    </ul>
  );

const mono = (text: string) => <span className="fm-mono">{text}</span>;

function details(card: MarketplaceToolCard) {
  const interfaces = Object.entries(card.interfaces)
    .filter(([, on]) => on)
    .map(([name]) => name.toUpperCase())
    .join(", ");
  return [
    { label: "Version", value: mono(card.version) },
    { label: "Published", value: new Date(card.publishedAt).toLocaleDateString() },
    { label: "Interfaces", value: interfaces || "None" },
    {
      label: "Profiles",
      value: list(
        card.roles.map((r) => (
          <>
            {r.label} {mono(`(${r.name})`)}
          </>
        )),
      ),
    },
    { label: "Database", value: card.database ? "Yes, its own" : "No" },
    { label: "Outbound hosts", value: list(card.network.map(mono)) },
    {
      label: "Secrets an admin sets",
      value: list(
        card.secrets.map((s) => (
          <>
            {mono(s.name)}
            {s.why ? `: ${s.why}` : ""}
          </>
        )),
      ),
    },
    {
      label: "Asked of each person",
      value: list(
        card.userSecrets.map((s) => (
          <>
            {s.label} {mono(`(${s.name})`)}
          </>
        )),
      ),
    },
    {
      label: "Connectors",
      value: list(
        card.connectors.map((c) => (
          <>
            {c.name} {mono(`(${c.type})`)}
          </>
        )),
      ),
    },
    { label: "Asks for", value: list(card.resources.map(mono)) },
  ];
}

const changelogLine = (entry: unknown) =>
  typeof entry === "string"
    ? entry
    : typeof entry === "object" && entry !== null && "summary" in entry
      ? String((entry as { summary: unknown }).summary)
      : JSON.stringify(entry);

export default function ToolSheet({ api, go, id, tool }: PageProps & { id: string; tool: string }) {
  const card = useLoad(() => loadMarketplaceToolCard(api.fetchJson, id, tool), [api, id, tool]);
  const [tab, setTab] = useState("readme");
  const [confirming, setConfirming] = useState(false);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (card.loading) return <Loading shape="page" label="Loading the tool" />;
  if (!card.data) {
    return (
      <Page title="Tool in the marketplace">
        <LoadError what="This tool" error={card.error} onRetry={card.reload} />
      </Page>
    );
  }
  const c = card.data;

  const install = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const done = await installMarketplaceTool(api.sendJson, id, tool);
      // Next: who can use it (D-117). Where it could not go to production, its page says why.
      go(toolPath(done.tool));
    } catch (e) {
      setError(explain(e, "The tool was not installed. Try again."));
      setBusy(false);
    }
  };

  return (
    <Page
      title={c.title}
      description={
        <button type="button" className="fp-link" onClick={() => go(pathOf("marketplace"))}>
          Back to the marketplace
        </button>
      }
      actions={
        c.installed ? (
          <Button onClick={() => go(toolPath(c.name))}>Open in Tools</Button>
        ) : (
          <Button variant="primary" onClick={() => setConfirming(true)}>
            Install
          </Button>
        )
      }
    >
      <div className="fp-card">
        <div className="fp-card-head">
          <ToolIcon name={c.title} size="lg" />
          <div className="fp-card-titles">
            <p className="fp-card-summary">{c.summary || c.description}</p>
          </div>
          {c.installed ? <Badge tone="success">Installed</Badge> : null}
        </div>
        <div className="fp-card-body">
          <div className="fp-card-main">
            <Tabs
              label="About the tool"
              tabs={[
                { id: "readme", label: "README" },
                { id: "guide", label: "What its users read" },
                { id: "actions", label: `Actions (${c.actions.length})` },
                { id: "changelog", label: "Changelog" },
              ]}
              value={tab}
              onChange={setTab}
            >
              {tab === "readme" ? (
                c.readme ? (
                  <Markdown source={c.readme} images={NO_IMAGES} />
                ) : (
                  <p className="fc-muted">This tool has no README.</p>
                )
              ) : tab === "guide" ? (
                c.guide ? (
                  <Markdown source={c.guide} images={NO_IMAGES} />
                ) : (
                  <p className="fc-muted">
                    This tool has no guide: its users will only see its summary.
                  </p>
                )
              ) : tab === "actions" ? (
                <ul className="fm-actions">
                  {c.actions.map((a) => (
                    <li key={a.name}>
                      <code>{a.name}</code> <Badge>{a.access}</Badge> {a.description}
                    </li>
                  ))}
                </ul>
              ) : c.changelog.length > 0 ? (
                <ul className="fp-changelog">
                  {c.changelog.map((e, n) => (
                    <li key={n}>{changelogLine(e)}</li>
                  ))}
                </ul>
              ) : (
                <p className="fc-muted">No changelog entry for this version.</p>
              )}
            </Tabs>
          </div>
          <DetailList items={details(c)} />
        </div>
      </div>
      {confirming ? (
        <Dialog
          title={`Install ${c.title} ${c.version}?`}
          description="The tool is created in the workspace and goes to production. Then you choose who can use it."
          onClose={() => !busy && setConfirming(false)}
          footer={
            <>
              <Button onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={install}
                disabled={busy || (c.resources.length > 0 && !approved)}
                data-autofocus
              >
                {busy ? "Installing…" : "Install"}
              </Button>
            </>
          }
        >
          {c.resources.length > 0 ? (
            <>
              <p className="fc-caption" style={{ margin: 0 }}>
                It asks for
              </p>
              {list(c.resources.map(mono))}
              <Checkbox
                label="I approve what it asks for"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
            </>
          ) : (
            <p className="fc-muted">It asks for nothing that needs an approval.</p>
          )}
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </Dialog>
      ) : null}
    </Page>
  );
}
