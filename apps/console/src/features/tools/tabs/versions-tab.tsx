import { Badge, EmptyState, EnvTag } from "@forgeron/ui";
import { ago } from "../../../format";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadVersions, type VersionRow } from "../api";
import { ImpactBadge } from "../components";
import type { ToolTabProps } from "../tabs";

// The versions of a tool, newest first, each with what its author wrote and what the manifest says
// changed compared with the version published before it (sdk.md §16, "Where the changelog is read").

const KIND = (kind: string) => kind.replace(/[.-]/g, " ");

function Version({ row, now }: { row: VersionRow; now: Date }) {
  return (
    <li className="ft-version">
      <div className="ft-version-head">
        <h3 className="ft-version-name">
          <code>{row.version}</code>
        </h3>
        <span className="fc-badges">
          {row.environments.map((e) => (
            <span key={`${e.environment}/${e.branch ?? ""}`} className="ft-served">
              <EnvTag env={e.environment} />
              {e.branch ? <code>{e.branch}</code> : null}
            </span>
          ))}
        </span>
        <time className="fc-muted" dateTime={row.publishedAt} title={row.publishedAt}>
          {ago(row.publishedAt, now)}
        </time>
      </div>

      {row.previous ? (
        <p className="ft-compare">
          Compared with <code>{row.previous}</code>
          <ImpactBadge impact={row.impact} />
        </p>
      ) : (
        <p className="ft-compare fc-muted">First version.</p>
      )}

      {row.changelog && row.changelog.entries.length > 0 ? (
        <ul className="ft-entries" aria-label={`Changelog of ${row.version}`}>
          {row.changelog.entries.map((entry, i) => (
            <li key={i}>
              <span className="fc-mono fc-muted">{entry.type}</span> {entry.description}
              <Badge>{entry.bump}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="fc-muted ft-compare">No changelog entry.</p>
      )}

      {row.changes.length > 0 ? (
        <details className="ft-changes">
          <summary>What changed in the manifest ({row.changes.length})</summary>
          <ul>
            {row.changes.map((change, i) => (
              <li key={i}>
                <span>{KIND(change.kind)}</span> <code>{change.subject}</code>
                <Badge>{change.impact}</Badge>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}

export default function VersionsTab({ tool, api, now }: ToolTabProps) {
  const versions = useLoad(() => loadVersions(api.fetchJson, tool), [api, tool]);
  if (versions.loading) return <Loading label="Loading versions" />;
  if (!versions.data) {
    return <LoadError what="The versions" error={versions.error} onRetry={versions.reload} />;
  }
  if (versions.data.length === 0) {
    return (
      <EmptyState
        title="No version yet"
        description="Every deployment publishes a version. Deploy a branch to publish the first one."
      />
    );
  }
  return (
    <ul className="ft-versions-list">
      {versions.data.map((row) => (
        <Version key={row.version} row={row} now={now()} />
      ))}
    </ul>
  );
}
