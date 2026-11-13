import { addresses } from "@forgeron/platform-contract/client";
import type { UpdateRun, UpdateState } from "@forgeron/platform-contract";
import { Badge, Button, CopyBlock, Dialog, Markdown, Notice, safeHref } from "@forgeron/ui";
import { useEffect, useState } from "react";
import { explain, ok, typedClient, type Api } from "../../api";
import { can } from "../../shell/access";
import { Loading, LoadError, Requires } from "../../states";
import { useLoad } from "../../use-load";
import type { WorkspaceInfo } from "../../workspace";

// Updates (D-138), the panel of Settings > Operations > Install information: the version this
// platform runs, the latest release with its notes and the migrations it brings, and, for whoever holds
// "Update Forgeron", one button that updates it with a restore point of the database. The run is
// polled, step by step; on success the console itself has changed, so the person reloads.

const STEP_LABEL: Record<UpdateRun["steps"][number]["name"], string> = {
  download: "Download the release and check it",
  "restore-point": "Take a restore point of the database",
  migrate: "Apply the migrations",
  code: "Keep the new gateway and console",
  deploy: "Deploy the new version",
};

const STATE_WORD = {
  pending: "Waiting",
  running: "Running",
  done: "Done",
  failed: "Failed",
} as const;
const STATE_TONE = {
  pending: "neutral",
  running: "warning",
  done: "success",
  failed: "danger",
} as const;

/** Why an update is not offered, in plain words: a title for each reason; the platform's sentence says what to do. */
const BLOCKED_TITLE: Record<NonNullable<UpdateState["blocked"]>["code"], string> = {
  OFF: "Updating from the console is turned off",
  CLOUD: "Forgeron Cloud is updated for you",
  NOT_SELF_HOST: "This gateway cannot update itself",
  NO_DATABASE_ID: "This install does not know its database yet",
  NO_CREDENTIALS: "This install has no Cloudflare account to update with",
  RELEASES_UNAVAILABLE: "The latest release could not be read",
  NO_ARTIFACT: "This release cannot be installed from the console",
};

const day = (iso: string) => iso.slice(0, 10);

/** The latest run the person is following: one just started here, or one that is already running. */
function useRun(api: Api, first: UpdateRun | undefined, pollMs: number) {
  // What this page has seen of the run overrides what the page loaded: an update already running when
  // the page opens (started by someone else, or before a reload) is followed the same way.
  const [seen, setRun] = useState<UpdateRun>();
  const [lost, setLost] = useState(false);
  const run = seen ?? first;
  const id = run?.state === "running" ? run.id : undefined;
  useEffect(() => {
    if (!id) return;
    let live = true;
    const timer = setInterval(() => {
      void typedClient(api.fetchJson)(addresses.getPlatformUpdateRun, { params: { id } }).then(
        (answer) => {
          if (!live) return;
          setLost(false);
          setRun(ok(answer).run);
        },
        // The platform is being replaced under us, or is briefly unreachable: ask again.
        () => live && setLost(true),
      );
    }, pollMs);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [api, id, pollMs]);
  return { run, setRun, lost };
}

export function UpdatesPanel({
  api,
  ws,
  pollMs = 2000,
  reload = () => window.location.reload(),
}: {
  api: Api;
  ws: WorkspaceInfo;
  /** How often a running update is asked about. */
  pollMs?: number;
  /** Loads the console again once the platform has been replaced. */
  reload?: () => void;
}) {
  const state = useLoad(
    async () => ok(await typedClient(api.fetchJson)(addresses.getPlatformUpdate)),
    [api],
  );
  const { run, setRun, lost } = useRun(api, state.data?.running, pollMs);
  const [confirming, setConfirming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [problem, setProblem] = useState<string>();

  if (state.loading) return <Loading label="Checking for updates" shape="block" />;
  if (state.error || !state.data) {
    return <LoadError what="Updates" error={state.error} onRetry={state.reload} />;
  }
  const info = state.data;
  const mayUpdate = can(ws.person, "platform:update");
  const latest = info.latest;
  const failed = run?.state === "failed" ? run : info.lastFailed;

  const start = async () => {
    if (!latest) return;
    setStarting(true);
    setProblem(undefined);
    try {
      const answer = (await api.sendJson(
        addresses.startPlatformUpdate.path,
        { version: latest.version },
        "POST",
      )) as {
        run: UpdateRun;
      };
      setConfirming(false);
      setRun(answer.run);
    } catch (error) {
      setConfirming(false);
      setProblem(explain(error, "The update could not be started."));
    } finally {
      setStarting(false);
    }
  };

  return (
    <section className="fc-panel fc-stack" aria-label="Updates">
      <h2 className="fc-method-title">Updates</h2>
      {problem ? (
        <Notice tone="danger" title="The update did not start">
          {problem}
        </Notice>
      ) : null}

      {run ? <Progress run={run} lost={lost} onReload={reload} /> : <Release info={info} />}

      {!run && failed && failed.state === "failed" ? <Failure run={failed} /> : null}
      {run?.state === "failed" ? <Failure run={run} /> : null}

      {(!run || run.state === "failed") && info.available && !info.blocked && latest ? (
        mayUpdate ? (
          <div>
            <Button variant="primary" onClick={() => setConfirming(true)}>
              Update to v{latest.version}
            </Button>
          </div>
        ) : (
          <Requires permission="platform:update" what="Updating Forgeron" />
        )
      ) : null}

      {confirming && latest ? (
        <Dialog
          title={`Update to v${latest.version}?`}
          description="This replaces the platform you are using now."
          onClose={() => setConfirming(false)}
          footer={
            <>
              <Button onClick={() => setConfirming(false)} data-autofocus>
                Cancel
              </Button>
              <Button variant="primary" onClick={start} disabled={starting}>
                {starting ? "Starting…" : `Update to v${latest.version}`}
              </Button>
            </>
          }
        >
          <div className="fc-stack">
            <p style={{ margin: 0 }}>Forgeron will, in this order:</p>
            <ol style={{ margin: 0, paddingLeft: "var(--space-6)" }}>
              <li>download the release and check its checksum;</li>
              <li>
                take a restore point of the platform's database (without one, nothing changes);
              </li>
              <li>apply the release's migrations to the database;</li>
              <li>keep the new gateway and console, and deploy them.</li>
            </ol>
            <p style={{ margin: 0 }}>
              <strong>Every workspace on this platform is updated</strong>, not only this one. Tools
              keep running. Migrations cannot be undone, except by restoring the restore point,
              which also drops what was written to the database since.
            </p>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}

/** What is newer: the release, its notes and what it will migrate; or why nothing is offered. */
function Release({ info }: { info: UpdateState }) {
  const latest = info.latest;
  const link = latest ? safeHref(latest.url) : null;
  return (
    <>
      {info.blocked ? (
        <Notice tone="info" title={BLOCKED_TITLE[info.blocked.code]}>
          {info.blocked.message}
        </Notice>
      ) : null}
      {latest && !info.available ? (
        <p style={{ margin: 0 }}>
          <Badge tone="success" dot>
            Up to date
          </Badge>{" "}
          <span className="fc-muted">
            v{latest.version}, released {day(latest.publishedAt)}.
          </span>
        </p>
      ) : null}
      {latest && info.available ? (
        <>
          <p style={{ margin: 0 }}>
            <strong>v{latest.version}</strong> is available{" "}
            <span className="fc-muted">(released {day(latest.publishedAt)})</span>
            {link ? (
              <>
                {" "}
                <a href={link.href} target="_blank" rel="noreferrer noopener">
                  See the release on GitHub
                </a>
              </>
            ) : null}
          </p>
          {latest.notes.trim() ? <Markdown source={latest.notes} images={{}} /> : null}
          {info.pending && info.pending.migrations.length > 0 ? (
            <Notice
              tone="warning"
              title={`${info.pending.migrations.length} migration${info.pending.migrations.length === 1 ? "" : "s"} will be applied to the database`}
            >
              <ul style={{ margin: 0, paddingLeft: "var(--space-6)" }}>
                {info.pending.migrations.map((m) => (
                  <li key={m} className="fc-mono">
                    {m}
                  </li>
                ))}
              </ul>
              <p style={{ margin: "var(--space-2) 0 0" }}>
                A migration cannot be undone, except by restoring the restore point taken just
                before it.
              </p>
            </Notice>
          ) : info.pending ? (
            <p className="fc-muted" style={{ margin: 0 }}>
              This release has no migration to apply.
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/** The steps of a run as they stand; on success, the way to load the new console. */
function Progress({
  run,
  lost,
  onReload,
}: {
  run: UpdateRun;
  lost: boolean;
  onReload: () => void;
}) {
  return (
    <div className="fc-stack">
      <p style={{ margin: 0 }}>
        {run.state === "running" ? (
          <>
            Updating from <span className="fc-mono">v{run.from}</span> to{" "}
            <span className="fc-mono">v{run.to}</span>. You can leave this page: the update goes on.
          </>
        ) : run.state === "succeeded" ? (
          <>
            Updated from <span className="fc-mono">v{run.from}</span> to{" "}
            <span className="fc-mono">v{run.to}</span>.
          </>
        ) : (
          <>
            The update from <span className="fc-mono">v{run.from}</span> to{" "}
            <span className="fc-mono">v{run.to}</span> did not finish.
          </>
        )}
      </p>
      <ol className="fc-steps" aria-label="Steps of the update">
        {run.steps.map((step, index) => (
          <li key={step.name} className="fc-step" data-done={step.state === "done"}>
            <span className="fc-step-mark">{index + 1}</span>
            <div>
              <h3 className="fc-step-title">
                {STEP_LABEL[step.name]}
                <Badge tone={STATE_TONE[step.state]} dot>
                  {STATE_WORD[step.state]}
                </Badge>
              </h3>
              {step.message ? (
                <div className="fc-step-body">
                  <p>{step.message}</p>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {lost && run.state === "running" ? (
        <Notice tone="info" title="Waiting for the platform">
          The platform is not answering for a moment, which is normal while it switches to the new
          version. This page asks again.
        </Notice>
      ) : null}
      {run.state === "succeeded" ? (
        <Notice
          tone="success"
          title={`Forgeron is now v${run.to}`}
          action={
            <Button variant="primary" size="sm" onClick={onReload}>
              Reload
            </Button>
          }
        >
          The console itself changed: reload it to use the new version.
        </Notice>
      ) : null}
    </div>
  );
}

/** What failed, what was done by then, and how to go back. */
function Failure({ run }: { run: UpdateRun }) {
  const step = run.steps.find((s) => s.state === "failed");
  return (
    <Notice
      tone="danger"
      title={
        step ? `The update stopped at: ${STEP_LABEL[step.name].toLowerCase()}` : "The update failed"
      }
    >
      <div className="fc-stack">
        <p style={{ margin: 0 }}>{step?.message ?? run.error}</p>
        {run.restoreCommand ? (
          <>
            <p style={{ margin: 0 }}>
              The database may already have changed. To put it back to the restore point taken
              before, run this on a computer signed in to the Cloudflare account:
            </p>
            <CopyBlock value={run.restoreCommand} label="Restore the database" prefix="$" />
          </>
        ) : (
          <p style={{ margin: 0 }}>Nothing was changed on the platform.</p>
        )}
      </div>
    </Notice>
  );
}
