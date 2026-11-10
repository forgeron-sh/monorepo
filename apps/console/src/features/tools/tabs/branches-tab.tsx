import { Badge, Button, CopyBlock, EmptyState, EnvTag, Input, Select } from "@forgeron/ui";
import { useMemo, useState, type ReactNode } from "react";
import { ago } from "../../../format";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadBranches, loadVersions, type BranchRow, type Status } from "../api";
import { ActionMenu, BranchGlyph, CommitLine, CopyButton, StatusBadge } from "../components";
import { ClosePreviewDialog, ReleaseDialog } from "../release-dialog";
import type { ToolTabProps } from "../tabs";

// Production and one preview per branch (docs/console-ux.md, "Branches"): the deployment list of
// Vercel, with our vocabulary. A row opens onto its database, its last migration and its recent
// deployments; promoting and rolling back go through a dialog that says what changes.

type Action =
  | { kind: "promote"; row: BranchRow }
  | { kind: "rollback" }
  | { kind: "close"; row: BranchRow };

const host = (url: string) => url.replace(/^https?:\/\//, "");

export default function BranchesTab({ tool, api, ws, now }: ToolTabProps) {
  const admin = ws.person.admin;
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

  if (branches.loading) return <Loading shape="table" label="Loading branches" />;
  if (!data) {
    return <LoadError what="The branches" error={branches.error} onRetry={branches.reload} />;
  }
  if (!data.production && data.branches.length === 0) {
    return (
      <EmptyState
        title="Nothing is deployed yet"
        description="Deploy a branch to get its preview. Production takes a version you promote."
        action={
          <div className="fc-stack" style={{ textAlign: "start" }}>
            <CopyBlock
              label="Deploy a preview"
              value="forgeron deploy --env preview --branch <name>"
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
  const current = data.production?.version ?? null;

  return (
    <div className="fc-stack">
      <ul className="ft-rows" aria-label="Production">
        {data.production ? (
          <Row
            row={data.production}
            now={now()}
            actions={[]}
            primary={
              admin && data.production.rollbackTo ? (
                <Button size="sm" onClick={() => setAction({ kind: "rollback" })}>
                  Roll back
                </Button>
              ) : null
            }
          />
        ) : (
          <li className="ft-row ft-row-empty">
            <EnvTag env="production" />
            <span className="fc-muted">
              Nothing is live yet. Promote a version from a preview below.
            </span>
          </li>
        )}
      </ul>

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
            ? "No preview matches these filters."
            : "No preview yet. Deploy a branch with forgeron deploy --env preview --branch <name>."}
        </p>
      ) : (
        <ul className="ft-rows" aria-label="Previews">
          {shown.map((row) => (
            <Row
              key={row.branch}
              row={row}
              now={now()}
              primary={null}
              actions={
                admin
                  ? [
                      {
                        label: "Promote to production",
                        onSelect: () => setAction({ kind: "promote", row }),
                      },
                      { label: "Close preview", onSelect: () => setAction({ kind: "close", row }) },
                    ]
                  : []
              }
            />
          ))}
        </ul>
      )}

      {action?.kind === "promote" ? (
        <ReleaseDialog
          kind="promote"
          tool={tool}
          api={api}
          from={current}
          to={action.row.version}
          {...(versions.data ? { versions: versions.data } : {})}
          onClose={() => setAction(undefined)}
          onDone={done}
        />
      ) : null}
      {action?.kind === "rollback" && data.production?.rollbackTo ? (
        <ReleaseDialog
          kind="rollback"
          tool={tool}
          api={api}
          from={current}
          to={data.production.rollbackTo}
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
  const name = row.branch ?? "production";
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
          <EnvTag env={row.environment} />
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
            <dt>Recent deployments</dt>
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
