import { Badge, Button, CopyBlock, EmptyState, EnvTag, Input, Select } from "@forgeron/ui";
import { useMemo, useState, type ReactNode } from "react";
import { ago } from "../../../format";
import { can } from "../../../shell/access";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadBranches, loadVersions, type BranchRow, type Status } from "../api";
import { ActionMenu, BranchGlyph, CommitLine, CopyButton, StatusBadge } from "../components";
import { ClosePreviewDialog, RemoveChannelDialog, RollbackDialog } from "../release-dialog";
import type { ToolTabProps } from "../tabs";
import { UpdatePanel } from "./update-panel";

// The channels of a tool (docs/console-ux.md, "Channels", D-125): the permanent ones (production, and
// the ones added by whoever builds the tool) with their updates, then one temporary channel per pushed branch with its
// commits. A row opens onto its database, its last migration and its recent deployments. There is no
// promotion: a permanent channel takes the releases of the branch it follows, and rolls back to a
// release it served.

type Action =
  | { kind: "rollback"; row: BranchRow }
  | { kind: "remove"; channel: string }
  | { kind: "close"; row: BranchRow };

const host = (url: string) => url.replace(/^https?:\/\//, "");

export default function BranchesTab(props: ToolTabProps) {
  const [round, setRound] = useState(0);
  const [removing, setRemoving] = useState<string>();
  // An update moves a permanent channel: the list below reads it again.
  return (
    <div className="fc-stack">
      {can(props.ws.person, "tools:write") ? (
        <UpdatePanel
          key={`panel-${round}`}
          tool={props.tool}
          api={props.api}
          onUpdated={() => setRound((n) => n + 1)}
          onRemove={setRemoving}
        />
      ) : null}
      <BranchList key={round} {...props} />
      {removing ? (
        <RemoveChannelDialog
          tool={props.tool}
          channel={removing}
          api={props.api}
          onClose={() => setRemoving(undefined)}
          onDone={() => {
            setRemoving(undefined);
            setRound((n) => n + 1);
          }}
        />
      ) : null}
    </div>
  );
}

function BranchList({ tool, api, ws, now }: ToolTabProps) {
  // Roll back publishes an older version again; closing a channel is a change of the tool.
  const mayRollBack = can(ws.person, "tools:publish");
  const mayClose = can(ws.person, "tools:write");
  const branches = useLoad(() => loadBranches(api.fetchJson, tool), [api, tool]);
  // The changelog is for the dialogs: its failure does not stop the list.
  const versions = useLoad(() => loadVersions(api.fetchJson, tool), [api, tool]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [author, setAuthor] = useState("");
  const [action, setAction] = useState<Action>();

  const data = branches.data;
  const authors = useMemo(
    () =>
      [
        ...new Set(
          (data?.branches ?? []).flatMap((b) => (b.commit?.author ? [b.commit.author] : [])),
        ),
      ].sort(),
    [data],
  );
  const shown = useMemo(
    () =>
      (data?.branches ?? []).filter(
        (b) =>
          (!search || (b.branch ?? "").toLowerCase().includes(search.trim().toLowerCase())) &&
          (!status || b.status === status) &&
          (!author || b.commit?.author === author),
      ),
    [data, search, status, author],
  );

  if (branches.loading) return <Loading shape="table" label="Loading channels" />;
  if (!data) {
    return <LoadError what="The channels" error={branches.error} onRetry={branches.reload} />;
  }
  if (!data.production && data.channels.length === 0 && data.branches.length === 0) {
    return (
      <EmptyState
        title="Nothing is deployed yet"
        description="Push a branch: its CI deploys it to a channel of its own. Production takes the releases of the branch it follows."
        action={
          <div className="fc-stack" style={{ textAlign: "start" }}>
            <CopyBlock
              label="Make a release on the branch production follows"
              value="forgeron change --type added --bump minor -m '…' && forgeron release && git push --follow-tags"
              prefix="$"
            />
          </div>
        }
      />
    );
  }

  const done = () => {
    setAction(undefined);
    branches.reload();
    versions.reload();
  };
  const filtered = search !== "" || status !== "" || author !== "";
  const rollbackButton = (row: BranchRow) =>
    mayRollBack && row.rollbackTo ? (
      <Button size="sm" onClick={() => setAction({ kind: "rollback", row })}>
        Roll back
      </Button>
    ) : null;

  return (
    <div className="fc-stack">
      <ul className="ft-rows" aria-label="Permanent channels">
        {data.production ? (
          <Row
            row={data.production}
            now={now()}
            actions={[]}
            primary={rollbackButton(data.production)}
          />
        ) : (
          <li className="ft-row ft-row-empty">
            <EnvTag env="production" />
            <span className="fc-muted">
              Nothing is live yet. Production takes the releases of the branch it follows.
            </span>
          </li>
        )}
        {data.channels.map((row) => (
          <Row key={row.channel} row={row} now={now()} actions={[]} primary={rollbackButton(row)} />
        ))}
      </ul>

      <h2 className="fc-section-title" style={{ margin: 0 }}>
        Branches
      </h2>
      <p className="fc-section-hint" style={{ margin: 0 }}>
        One temporary channel per pushed branch, with its own data. It takes every push and goes
        when the branch is deleted.
      </p>

      <div className="ft-filters" role="search" aria-label="Filter the branches">
        <Input
          type="search"
          aria-label="Branch"
          placeholder="Search a branch"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status | "")}
          options={[
            { value: "", label: "All statuses" },
            { value: "ready", label: "Ready" },
            { value: "building", label: "Building" },
            { value: "failed", label: "Failed" },
          ]}
        />
        <Select
          aria-label="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          options={[
            { value: "", label: "All authors" },
            ...authors.map((a) => ({ value: a, label: a })),
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <p className="fc-muted ft-none">
          {filtered
            ? "No branch matches these filters."
            : "No branch yet. Push one: its CI deploys it (forgeron deploy --branch <name>)."}
        </p>
      ) : (
        <ul className="ft-rows" aria-label="Branches">
          {shown.map((row) => (
            <Row
              key={row.branch}
              row={row}
              now={now()}
              primary={null}
              actions={
                mayClose
                  ? [{ label: "Close channel", onSelect: () => setAction({ kind: "close", row }) }]
                  : []
              }
            />
          ))}
        </ul>
      )}

      {action?.kind === "rollback" && action.row.rollbackTo ? (
        <RollbackDialog
          tool={tool}
          api={api}
          channel={action.row.channel ?? "production"}
          from={action.row.version}
          to={action.row.rollbackTo}
          {...(versions.data ? { versions: versions.data } : {})}
          onClose={() => setAction(undefined)}
          onDone={done}
        />
      ) : null}
      {action?.kind === "close" && action.row.branch ? (
        <ClosePreviewDialog
          tool={tool}
          branch={action.row.branch}
          api={api}
          onClose={() => setAction(undefined)}
          onDone={done}
        />
      ) : null}
    </div>
  );
}

function Row({
  row,
  now,
  actions,
  primary,
}: {
  row: BranchRow;
  now: Date;
  actions: ReadonlyArray<{ label: string; onSelect: () => void }>;
  primary: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const name = row.branch ?? row.channel ?? "production";
  return (
    <li className="ft-row" data-env={row.environment}>
      <div className="ft-row-main">
        <button
          type="button"
          className="ft-expand"
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} the details of ${name}`}
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true">{open ? "▾" : "▸"}</span>
        </button>
        <div className="ft-cell ft-name">
          <EnvTag env={row.environment}>{row.channel}</EnvTag>
          {row.follows ? (
            <span className="ft-branch fc-muted" title={`Follows ${row.follows}`}>
              <BranchGlyph />
              <code>{row.follows}</code>
            </span>
          ) : null}
          {row.branch ? (
            <span className="ft-branch">
              <BranchGlyph />
              <code title={row.branch}>{row.branch}</code>
            </span>
          ) : null}
        </div>
        <div className="ft-cell ft-what">
          <CommitLine {...(row.commit ? { commit: row.commit } : {})} />
        </div>
        <div className="ft-cell ft-who">
          <span>{row.commit?.author ?? row.deployedBy}</span>
          <time className="fc-muted" dateTime={row.deployedAt} title={row.deployedAt}>
            {ago(row.deployedAt, now)}
          </time>
        </div>
        <div className="ft-cell ft-state">
          <StatusBadge status={row.status} />
          <Badge mono>{row.version}</Badge>
        </div>
        <div className="ft-cell ft-address">
          {row.url ? (
            <>
              <code title={row.url}>{host(row.url)}</code>
              <span className="ft-address-actions">
                <CopyButton value={row.url} label={`the address of ${name}`} />
                <Button
                  size="sm"
                  variant="ghost"
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${name} in a new tab`}
                >
                  Open
                </Button>
              </span>
            </>
          ) : (
            <span className="fc-muted">No address</span>
          )}
        </div>
        <div className="ft-cell ft-actions">
          {primary}
          {row.environment === "preview" ? (
            <ActionMenu label={`Actions for ${name}`} items={actions} />
          ) : null}
        </div>
      </div>
      {open ? (
        <dl className="ft-detail">
          <div>
            <dt>Database</dt>
            <dd>
              {row.migrations.count === 0
                ? "No migration applied."
                : `${row.migrations.count} ${row.migrations.count === 1 ? "migration" : "migrations"} applied.`}
            </dd>
          </div>
          <div>
            <dt>Last migration</dt>
            <dd>{row.migrations.last ? <code>{row.migrations.last}</code> : "None"}</dd>
          </div>
          <div className="ft-detail-wide">
            <dt>{row.environment === "preview" ? "Commits" : "Recent deployments"}</dt>
            <dd>
              <ul className="ft-history">
                {row.deployments.map((d, i) => (
                  <li key={i}>
                    <time dateTime={d.at} title={d.at}>
                      {ago(d.at, now)}
                    </time>
                    <Badge>{d.kind}</Badge>
                    <code>{d.version}</code>
                    <span className="fc-muted">{d.actor}</span>
                    {d.commit ? <code title={d.commit.sha}>{d.commit.sha.slice(0, 7)}</code> : null}
                    {d.commit?.message ? <span>{d.commit.message}</span> : null}
                    {d.commit?.author ? <span className="fc-muted">{d.commit.author}</span> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      ) : null}
    </li>
  );
}
