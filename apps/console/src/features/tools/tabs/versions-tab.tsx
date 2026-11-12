import { Badge, Checkbox, EmptyState, EnvTag } from "@forgeron/ui";
import { useState } from "react";
import { ago } from "../../../format";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadVersions, type VersionRow } from "../api";
import { ImpactBadge } from "../components";
import type { ToolTabProps } from "../tabs";

// The releases of a tool, newest first, each with what its author wrote and what the manifest says
// changed compared with the version published before it (sdk.md §16, "Where the changelog is read").
// Only a release reaches a permanent channel (D-125); the other builds of the branches can be shown.

const KIND = (kind: string) => kind.replace(/[.-]/g, " ");

function Version({ row, now }: { row: VersionRow; now: Date }) {
  return (
    <li className="ft-version">
      <div className="ft-version-head">
        <h3 className="ft-version-name">
          <code>{row.version}</code>
        </h3>
        <span className="fc-badges">
          {row.release ? <Badge tone="success">Release</Badge> : <Badge>Build</Badge>}
          {row.branch ? (
            <span className="fc-muted">
              on <code>{row.branch}</code>
            </span>
          ) : null}
          {row.environments.map((e) => (
            <span key={`${e.environment}/${e.branch ?? e.channel ?? ""}`} className="ft-served">
              <EnvTag env={e.environment}>{e.channel}</EnvTag>
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

interface Served {
  key: string;
  environment: "production" | "preview" | "channel";
  branch?: string;
  channel?: string;
  row: VersionRow;
}

/** One line per environment, production first: the version it serves, read from the versions list. */
function served(rows: VersionRow[]): Served[] {
  const out: Served[] = [];
  for (const row of rows) {
    for (const e of row.environments) {
      out.push({
        key: `${e.environment}/${e.branch ?? e.channel ?? ""}`,
        environment: e.environment,
        ...(e.branch ? { branch: e.branch } : {}),
        ...(e.channel ? { channel: e.channel } : {}),
        row,
      });
    }
  }
  // Production first, then the other permanent channels, then the branches.
  const rank = (s: Served) =>
    s.environment === "production" ? 0 : s.environment === "channel" ? 1 : 2;
  return out.sort((a, b) => rank(a) - rank(b));
}

function Environments({ rows }: { rows: VersionRow[] }) {
  const list = served(rows);
  if (list.length === 0) return null;
  return (
    <section aria-label="Version of each channel">
      <h3 className="ft-version-name">Channels</h3>
      <ul className="ft-versions-list ft-environments">
        {list.map(({ key, environment, branch, channel, row }) => (
          <li key={key} className="ft-version">
            <div className="ft-version-head">
              <span className="ft-served">
                <EnvTag env={environment}>{channel}</EnvTag>
                {branch ? <code>{branch}</code> : null}
              </span>
              <code>{row.version}</code>
              {row.previous ? (
                <span className="fc-muted">
                  since <code>{row.previous}</code>
                  <ImpactBadge impact={row.impact} />
                </span>
              ) : (
                <span className="fc-muted">First version</span>
              )}
            </div>
            {row.changelog && row.changelog.entries.length > 0 ? (
              <ul className="ft-entries" aria-label={`Contents of ${row.version}`}>
                {row.changelog.entries.map((entry, i) => (
                  <li key={i}>
                    <span className="fc-mono fc-muted">{entry.type}</span> {entry.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fc-muted ft-compare">No changelog entry.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function VersionsTab({ tool, api, now }: ToolTabProps) {
  const versions = useLoad(() => loadVersions(api.fetchJson, tool), [api, tool]);
  const [builds, setBuilds] = useState(false);
  if (versions.loading) return <Loading shape="table" label="Loading releases" />;
  if (!versions.data) {
    return <LoadError what="The releases" error={versions.error} onRetry={versions.reload} />;
  }
  if (versions.data.length === 0) {
    return (
      <EmptyState
        title="No release yet"
        description="A release is made on a branch with forgeron change and forgeron release, then pushed. Every push of a branch publishes a build."
      />
    );
  }
  const shown = builds ? versions.data : versions.data.filter((row) => row.release);
  return (
    <>
      <Environments rows={versions.data} />
      <div className="ft-release-head">
        <h3 className="ft-version-name">{builds ? "Releases and builds" : "Releases"}</h3>
        <Checkbox
          label="Show the builds that are not releases"
          checked={builds}
          onChange={(e) => setBuilds(e.target.checked)}
        />
      </div>
      {shown.length === 0 ? (
        <p className="fc-muted">
          No release yet: only builds of branches. A permanent channel takes only releases.
        </p>
      ) : (
        <ul className="ft-versions-list">
          {shown.map((row) => (
            <Version key={row.version} row={row} now={now()} />
          ))}
        </ul>
      )}
    </>
  );
}
