import { Badge, Button, Checkbox, Notice } from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../../api";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadSource, saveSource, updateTool, type ToolSourceView } from "../api";

// Where the tool comes from, and its update (D-121), above the branches: a marketplace's newer release,
// or what the preview of the production branch serves. The admin reads what it brings and what it asks
// for, approves it in the same step, and puts it in production. A tool can update by itself: a new
// version that asks for nothing new goes on its own; the others wait here.

export function UpdatePanel({
  tool,
  api,
  onUpdated,
}: {
  tool: string;
  api: Api;
  onUpdated: () => void;
}) {
  const source = useLoad(() => loadSource(api.fetchJson, tool), [api, tool]);
  if (source.loading && !source.data) return <Loading shape="block" label="Loading the updates" />;
  if (!source.data) {
    return <LoadError what="The updates" error={source.error} onRetry={source.reload} />;
  }
  return (
    <Panel
      key={source.data.update?.version ?? "none"}
      tool={tool}
      api={api}
      source={source.data}
      onChanged={() => {
        source.reload();
        onUpdated();
      }}
    />
  );
}

const origin = (s: ToolSourceView) =>
  s.kind === "marketplace"
    ? s.marketplace === "official"
      ? "the official marketplace"
      : "a marketplace of the workspace"
    : s.repo
      ? `GitHub, ${s.repo}`
      : "its repository";

function Panel({
  tool,
  api,
  source,
  onChanged,
}: {
  tool: string;
  api: Api;
  source: ToolSourceView;
  onChanged: () => void;
}) {
  const [approve, setApprove] = useState(false);
  const [withoutRelease, setWithoutRelease] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const { update } = source;
  const needsApproval = (update?.approvals.length ?? 0) > 0;
  const needsAck = update !== null && !update.release;
  const ready = update !== null && (!needsApproval || approve) && (!needsAck || withoutRelease);

  const act = async (work: () => Promise<unknown>, failure: string) => {
    setBusy(true);
    setError(undefined);
    try {
      await work();
      onChanged();
    } catch (e) {
      setError(explain(e, failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ft-update" aria-labelledby="update-title">
      <div className="ft-update-head">
        <div>
          <h2 id="update-title" className="fc-section-title">
            Updates
          </h2>
          <p className="fc-section-hint" style={{ margin: 0 }}>
            Comes from {origin(source)}
            {source.kind === "repo" ? (
              <>
                {" "}
                · production follows <code>{source.productionBranch}</code>
              </>
            ) : null}
            {" · "}
            {source.production ? (
              <>
                production serves <code>{source.production}</code>
              </>
            ) : (
              "nothing in production yet"
            )}
          </p>
        </div>
        <Checkbox
          label={
            <>
              Update by itself{" "}
              <span className="fc-muted">
                A new version that asks for nothing new goes to production on its own.
              </span>
            </>
          }
          checked={source.autoUpdate}
          disabled={busy}
          onChange={(e) =>
            act(
              () => saveSource(api, tool, { autoUpdate: e.target.checked }),
              "The setting was not saved. Try again.",
            )
          }
        />
      </div>

      {update ? (
        <div className="ft-update-card">
          <p className="ft-release-head" style={{ margin: 0 }}>
            <span>
              Update available: <code>{update.version}</code>
              {update.branch ? (
                <span className="fc-muted">
                  {" "}
                  from <code>{update.branch}</code>
                </span>
              ) : null}
            </span>
            {update.release ? (
              <Badge tone="success">Release</Badge>
            ) : (
              <Badge tone="warning">Not a release</Badge>
            )}
          </p>
          {update.changelog.length > 0 ? (
            <ul className="ft-entries">
              {update.changelog.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}
          {needsApproval ? (
            <div className="ft-asks">
              <span className="fc-caption">It asks for</span>
              <ul className="ft-entries">
                {update.approvals.map((a) => (
                  <li key={a} className="fc-mono">
                    {a}
                  </li>
                ))}
              </ul>
              <Checkbox
                label="I approve what it asks for"
                checked={approve}
                onChange={(e) => setApprove(e.target.checked)}
              />
            </div>
          ) : null}
          {needsAck ? (
            <Notice tone="warning" title="This build is not a release.">
              It has no changelog: the people who use the tool will not know what changes.
              <Checkbox
                label="Put it in production without a release"
                checked={withoutRelease}
                onChange={(e) => setWithoutRelease(e.target.checked)}
              />
            </Notice>
          ) : null}
          <div>
            <Button
              variant="primary"
              disabled={busy || !ready}
              onClick={() =>
                act(
                  () =>
                    updateTool(api, tool, {
                      version: update.version,
                      ...(needsApproval ? { approve: true } : {}),
                      ...(needsAck ? { withoutRelease: true } : {}),
                    }),
                  "The update did not go to production. Try again.",
                )
              }
            >
              {busy ? "Updating…" : "Update production"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="fc-muted" style={{ margin: 0 }}>
          Up to date.
        </p>
      )}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </section>
  );
}
