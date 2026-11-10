import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
  Notice,
  Page,
  Tabs,
  ToolCard,
} from "@forgeron/ui";
import { useState } from "react";
import { explain } from "../../../api";
import { ago } from "../../../format";
import type { PageProps } from "../../../shell/page-props";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import {
  addMarketplace,
  loadMarketplaces,
  loadMarketplaceTools,
  marketplaceLabel,
  removeMarketplace,
  syncMarketplace,
  toolSheetPath,
  type MarketplaceRow,
  type SyncAnswer,
} from "../api";
import "../marketplace.css";

// The marketplaces (D-116): the official catalogue and the GitHub repositories the workspace added. A
// tab per marketplace lists what it offers; a card opens the tool's technical sheet, where it is
// installed. Syncing reads the repository's index and records the versions it publishes.

function Offer({
  api,
  go,
  marketplace,
  now,
  onChanged,
}: Pick<PageProps, "api" | "go" | "now"> & { marketplace: MarketplaceRow; onChanged: () => void }) {
  const tools = useLoad(
    () => loadMarketplaceTools(api.fetchJson, marketplace.id),
    [api, marketplace.id],
  );
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<SyncAnswer>();
  const [error, setError] = useState<string>();
  const [removing, setRemoving] = useState(false);

  const sync = async () => {
    setBusy(true);
    setError(undefined);
    setReport(undefined);
    try {
      setReport(await syncMarketplace(api.sendJson, marketplace.id));
      tools.reload();
      onChanged();
    } catch (e) {
      setError(explain(e, "The marketplace could not be read. Try again."));
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeMarketplace(api.sendJson, marketplace.id);
      setRemoving(false);
      onChanged();
    } catch (e) {
      setError(explain(e, "The marketplace was not removed. Try again."));
      setBusy(false);
    }
  };

  const synced = marketplace.syncedAt
    ? `Synced ${ago(marketplace.syncedAt, now())}`
    : marketplace.official
      ? "The tools Forgeron maintains."
      : "Not synced yet.";

  return (
    <>
      <div className="fm-head">
        <p className="fm-head-text">
          {marketplace.repo ? <span className="fm-mono">{marketplace.repo}</span> : null}
          {marketplace.repo ? " · " : null}
          {synced}
          {marketplace.hasToken ? " · private, read with a token" : null}
        </p>
        {marketplace.repo ? (
          <Button onClick={sync} disabled={busy}>
            {busy ? "Syncing…" : "Sync"}
          </Button>
        ) : null}
        {marketplace.official ? null : (
          <Button variant="danger" onClick={() => setRemoving(true)} disabled={busy}>
            Remove
          </Button>
        )}
      </div>
      {marketplace.syncError && !report ? (
        <Notice tone="danger">The last sync failed: {marketplace.syncError}</Notice>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {report ? (
        <Notice tone={report.tools.some((t) => t.status === "refused") ? "warning" : "success"}>
          Sync done.
          <ul className="fm-report">
            {report.tools.map((t) => (
              <li key={t.name}>
                <span className="fm-mono">
                  {t.name} {t.version}
                </span>
                : {t.status}
                {t.reason ? ` (${t.reason})` : ""}
              </li>
            ))}
          </ul>
        </Notice>
      ) : null}
      {tools.loading ? (
        <Loading shape="cards" label="Loading the tools" />
      ) : tools.error && !tools.data ? (
        <LoadError what="The tools" error={tools.error} onRetry={tools.reload} />
      ) : (tools.data ?? []).length === 0 ? (
        <EmptyState
          title="Nothing to install yet"
          description={
            marketplace.repo
              ? "Sync to read what this marketplace publishes."
              : "No tool has been published here yet."
          }
        />
      ) : (
        <ul className="fm-grid">
          {(tools.data ?? []).map((t) => (
            <ToolCard
              key={t.name}
              name={t.title}
              summary={t.summary}
              href={toolSheetPath(marketplace.id, t.name)}
              onNavigate={go}
              meta={
                <span className="fm-meta">
                  <span className="fm-mono">{t.version}</span>
                  {t.installed ? <Badge tone="success">Installed</Badge> : null}
                  {t.resources.length > 0 ? (
                    <Badge>
                      {t.resources.length} {t.resources.length === 1 ? "approval" : "approvals"}
                    </Badge>
                  ) : null}
                </span>
              }
            />
          ))}
        </ul>
      )}
      {removing ? (
        <Dialog
          title={`Remove ${marketplaceLabel(marketplace)}?`}
          description="Its token and what it offers are removed. The tools already installed from it stay in the workspace."
          onClose={() => !busy && setRemoving(false)}
          footer={
            <>
              <Button onClick={() => setRemoving(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" onClick={remove} disabled={busy} data-autofocus>
                Remove
              </Button>
            </>
          }
        />
      ) : null}
    </>
  );
}

function AddDialog({
  api,
  onClose,
  onAdded,
}: Pick<PageProps, "api"> & { onClose: () => void; onAdded: (id: string) => void }) {
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const added = await addMarketplace(api.sendJson, repo.trim(), token.trim() || undefined);
      // A first sync right away; a failure shows on the tab, where it can be tried again.
      await syncMarketplace(api.sendJson, added.id).catch(() => undefined);
      onAdded(added.id);
    } catch (e) {
      setError(explain(e, "The marketplace was not added. Try again."));
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="Add a marketplace"
      description="A GitHub repository with a forgeron-marketplace.json at its root."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !repo.trim()}>
            {busy ? "Adding…" : "Add"}
          </Button>
        </>
      }
    >
      <Field label="Repository" hint="owner/name, for example edicia-sh/tools">
        {(control) => (
          <Input
            {...control}
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/name"
            autoComplete="off"
            data-autofocus
          />
        )}
      </Field>
      <Field
        label="Read token"
        hint="For a private repository: a GitHub fine-grained token with Contents: read on it. It is sealed and never shown again."
      >
        {(control) => (
          <Input
            {...control}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
          />
        )}
      </Field>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

export default function MarketplacePage({ api, go, now }: PageProps) {
  const marketplaces = useLoad(() => loadMarketplaces(api.fetchJson), [api]);
  const [selected, setSelected] = useState<string>("official");
  const [adding, setAdding] = useState(false);
  const list = marketplaces.data ?? [];
  const current = list.find((m) => m.id === selected) ?? list[0];

  return (
    <Page
      title="Marketplace"
      description="Install tools from the official catalogue or from your own marketplaces. An installed tool waits for its approvals, then for you to choose who can use it."
      actions={
        <Button variant="primary" onClick={() => setAdding(true)}>
          Add a marketplace
        </Button>
      }
    >
      {marketplaces.loading ? (
        <Loading shape="cards" label="Loading the marketplaces" />
      ) : marketplaces.error && !marketplaces.data ? (
        <LoadError
          what="The marketplaces"
          error={marketplaces.error}
          onRetry={marketplaces.reload}
        />
      ) : current ? (
        <Tabs
          label="Marketplaces"
          tabs={list.map((m) => ({ id: m.id, label: marketplaceLabel(m) }))}
          value={current.id}
          onChange={setSelected}
        >
          <Offer
            key={current.id}
            api={api}
            go={go}
            now={now}
            marketplace={current}
            onChanged={marketplaces.reload}
          />
        </Tabs>
      ) : null}
      {adding ? (
        <AddDialog
          api={api}
          onClose={() => setAdding(false)}
          onAdded={(id) => {
            setAdding(false);
            setSelected(id);
            marketplaces.reload();
          }}
        />
      ) : null}
    </Page>
  );
}
