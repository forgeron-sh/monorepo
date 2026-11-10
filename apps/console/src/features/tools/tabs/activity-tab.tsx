import { Badge, EmptyState, Table, type TableColumn } from "@forgeron/ui";
import { ago } from "../../../format";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadActivity, type ActivityLine } from "../api";
import type { ToolTabProps } from "../tabs";

// The tool's audit log: who did what, through which interface, and how it ended.

export default function ActivityTab({ tool, api, now }: ToolTabProps) {
  const activity = useLoad(() => loadActivity(api.fetchJson, tool), [api, tool]);
  if (activity.loading) return <Loading shape="list" label="Loading activity" />;
  if (!activity.data) {
    return <LoadError what="The activity" error={activity.error} onRetry={activity.reload} />;
  }
  if (activity.data.length === 0) {
    return (
      <EmptyState
        title="Nothing has happened yet"
        description="Deployments, promotions, approvals and every action call are written here."
      />
    );
  }
  const clock = now();
  const columns: Array<TableColumn<ActivityLine>> = [
    {
      key: "at",
      header: "When",
      render: (r) => (
        <time dateTime={r.at} title={r.at}>
          {ago(r.at, clock)}
        </time>
      ),
    },
    { key: "actor", header: "Who", mono: true },
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
    { key: "interface", header: "Through", render: (r) => r.interface || "—" },
    {
      key: "result",
      header: "Result",
      render: (r) => (
        <Badge
          tone={r.result === "ok" ? "success" : r.result === "denied" ? "warning" : "danger"}
          dot
        >
          {r.result === "ok" ? "Done" : r.result === "denied" ? "Denied" : "Failed"}
        </Badge>
      ),
    },
  ];
  return <Table columns={columns} rows={activity.data} rowKey={(r) => r.id} />;
}
