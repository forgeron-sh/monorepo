import { Badge, EmptyState, Page, Table, type TableColumn } from "@forgeron/ui";
import { addresses } from "@forgeron/platform-contract/client";
import { typedClient, ok, type Api, type FetchJson } from "./api";
import { ago } from "./format";
import { AdminOnly, Loading, LoadError } from "./states";
import { useLoad } from "./use-load";

// The latest audit lines of the workspace's tools: who did what, through which interface, and how it ended.

export interface AuditRow {
  id: string;
  at: string;
  tool: string;
  actor: string;
  interface: string;
  kind: string;
  subject: string;
  result: "ok" | "denied" | "error";
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

export async function loadAudit(fetchJson: FetchJson): Promise<AuditRow[]> {
  const body = ok(await typedClient(fetchJson)(addresses.audit, { query: {} }));
  return (body.entries ?? []).map((e) => ({
    id: text(e.id),
    at: text(e.at),
    tool: text(e.tool),
    actor: text(e.actor),
    interface: text(e.interface),
    kind: text(e.kind),
    subject: text(e.subject),
    result: e.result === "denied" || e.result === "error" ? e.result : "ok",
  }));
}

function AuditTable({ rows, now }: { rows: ReadonlyArray<AuditRow>; now: Date }) {
  const columns: Array<TableColumn<AuditRow>> = [
    {
      key: "at",
      header: "When",
      render: (r) => (
        <time dateTime={r.at} title={r.at}>
          {ago(r.at, now)}
        </time>
      ),
    },
    { key: "actor", header: "Who", mono: true },
    { key: "tool", header: "Tool", mono: true },
    {
      key: "subject",
      header: "What",
      render: (r) => (
        <span className="fc-badges">
          <Badge>{r.kind}</Badge>
          <code>{r.subject}</code>
        </span>
      ),
    },
    {
      key: "interface",
      header: "Via",
      render: (r) => (r.interface ? <Badge mono>{r.interface}</Badge> : null),
    },
    {
      key: "result",
      header: "Result",
      render: (r) => (
        <Badge tone={r.result === "ok" ? "success" : "danger"} dot>
          {r.result === "ok" ? "ok" : r.result === "denied" ? "denied" : "failed"}
        </Badge>
      ),
    },
  ];
  return <Table columns={columns} rows={rows} rowKey={(r) => r.id} empty="Nothing recorded yet." />;
}

export function AuditPage({ api, admin, now }: { api: Api; admin: boolean; now: () => Date }) {
  const audit = useLoad(
    () => (admin ? loadAudit(api.fetchJson) : Promise.resolve([])),
    [api, admin],
  );
  return (
    <Page
      title="Audit log"
      description="The latest actions, deployments, approvals and access changes of your tools."
    >
      {!admin ? (
        <AdminOnly what="The audit log" />
      ) : audit.loading ? (
        <Loading shape="table" label="Loading the audit log" />
      ) : audit.error && !audit.data ? (
        <LoadError what="The audit log" error={audit.error} onRetry={audit.reload} />
      ) : audit.data && audit.data.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          description="Every deployment, approval, access change and action call of a tool is recorded here."
        />
      ) : (
        <AuditTable rows={audit.data ?? []} now={now()} />
      )}
    </Page>
  );
}
