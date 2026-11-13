import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
  SkeletonGroup,
  Table,
  type TableColumn,
} from "@forgeron/ui";
import { ago } from "../../../format";
import { LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadCi, type CiRun } from "../api";
import type { ToolTabProps } from "../tabs";

// The CI of a tool that a GitHub repository deploys: the recent GitHub Actions runs, newest first,
// each linking to the run on GitHub. A successful run on the production branch deploys a release;
// on another branch, a temporary channel. A tool with no repository, or whose GitHub App may not
// read Actions yet, says why instead of an empty list.

const STATUS = {
  queued: { tone: "neutral", label: "Queued" },
  in_progress: { tone: "warning", label: "In progress" },
  success: { tone: "success", label: "Success" },
  failure: { tone: "danger", label: "Failed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
} as const;

/** A state is a dot and a word, never a colour alone. */
function RunStatus({ status }: { status: CiRun["status"] }) {
  const { tone, label } = STATUS[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

/** `2m 5s`, `45s`, `1h 3m`; nothing while the run has not finished. */
export function duration(seconds: number | null): string {
  if (seconds === null) return "";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const link = (url: string) => ({ href: url, target: "_blank", rel: "noreferrer" }) as const;

export default function CiTab({ tool, api, now }: ToolTabProps) {
  const ci = useLoad(() => loadCi(api.fetchJson, tool), [api, tool]);
  const clock = now();

  if (ci.loading) {
    return (
      <SkeletonGroup label="Loading the CI runs">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="fc-skeleton-row">
            <Skeleton width="24%" />
            <Skeleton width="40%" />
            <Skeleton width="16%" />
          </div>
        ))}
      </SkeletonGroup>
    );
  }
  const answer = ci.data;
  if (!answer) return <LoadError what="The CI runs" error={ci.error} onRetry={ci.reload} />;

  if (answer.state === "no-repository") {
    return (
      <EmptyState
        title="This tool has no repository"
        description="Its CI is the one of the repository that deploys it. A tool deployed from a terminal, or installed from a marketplace, has none: link a repository by adding the tool from GitHub."
      />
    );
  }
  if (answer.state === "no-app") {
    return (
      <EmptyState
        title="Forgeron cannot reach this repository"
        description={`The workspace has no GitHub App installed on the owner of ${answer.repo}, so its CI runs cannot be read.`}
        action={<Button {...linkOf(answer.repo)}>View on GitHub ↗</Button>}
      />
    );
  }
  if (answer.state === "no-permission") {
    return (
      <EmptyState
        title="Forgeron may not read the CI yet"
        description="Allow Forgeron to read Actions in the GitHub App's settings: the app asks for this permission since this tab exists, and its owner accepts it on GitHub."
        action={
          <div className="fc-stack">
            <Button variant="primary" {...link(answer.settingsUrl)}>
              Open the GitHub App's settings ↗
            </Button>
            <Button {...linkOf(answer.repo)}>View on GitHub ↗</Button>
          </div>
        }
      />
    );
  }

  const columns: Array<TableColumn<CiRun>> = [
    {
      key: "workflow",
      header: "Workflow",
      render: (r) => (
        <a className="ft-run-link" {...link(r.url)}>
          {r.workflow} ↗
        </a>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      render: (r) => <code>{r.branch}</code>,
    },
    {
      key: "message",
      header: "Commit",
      render: (r) => <span className="ft-run-message">{r.message || r.sha.slice(0, 7)}</span>,
    },
    { key: "actor", header: "By", render: (r) => r.actor },
    { key: "status", header: "Status", render: (r) => <RunStatus status={r.status} /> },
    {
      key: "started",
      header: "Started",
      render: (r) => (
        <time dateTime={r.startedAt} title={r.startedAt}>
          {ago(r.startedAt, clock)}
        </time>
      ),
    },
    { key: "duration", header: "Duration", render: (r) => duration(r.durationSeconds) },
  ];

  return (
    <div className="fc-stack">
      <div className="ft-ci-head">
        <p className="fc-muted ft-ci-note">
          A successful run on <code>{answer.productionBranch}</code> deploys a release; on another
          branch, a temporary channel.
        </p>
        <Button {...link(answer.actionsUrl)}>View on GitHub ↗</Button>
      </div>
      <Table
        columns={columns}
        rows={answer.runs}
        rowKey={(r) => r.id}
        empty="No run yet. Push to the repository: its CI starts here."
      />
    </div>
  );
}

/** The repository's page on GitHub. */
function linkOf(repo: string) {
  return link(`https://github.com/${repo}`);
}
