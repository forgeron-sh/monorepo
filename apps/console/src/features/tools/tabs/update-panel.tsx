import { Badge, Button, Checkbox, CopyBlock, Field, Input, Notice } from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../../api";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import {
  addChannel,
  loadSource,
  saveChannel,
  updateTool,
  type ChannelView,
  type ToolSourceView,
} from "../api";

// The permanent channels of a tool and their updates (D-121, D-125). Production, and the channels an
// admin adds (staging, recette), each follow a branch and take only its releases (a marketplace tool's
// follow the marketplace). The admin reads what a release brings and what it asks for, approves it in
// the same step, and updates the channel. A channel can update by itself: a release that asks for
// nothing new goes on its own; the others wait here. Forgeron never moves code between branches.

const CHANNEL = /^[a-z][a-z0-9-]{0,29}$/;

export function UpdatePanel({
  tool,
  api,
  onUpdated,
  onRemove,
}: {
  tool: string;
  api: Api;
  onUpdated: () => void;
  /** Asks to remove a permanent channel other than production (a dialog that confirms). */
  onRemove?: (channel: string) => void;
}) {
  const source = useLoad(() => loadSource(api.fetchJson, tool), [api, tool]);
  if (source.loading && !source.data) return <Loading shape="block" label="Loading the channels" />;
  if (!source.data) {
    return <LoadError what="The channels" error={source.error} onRetry={source.reload} />;
  }
  const changed = () => {
    source.reload();
    onUpdated();
  };
  const channels = source.data.channels ?? [];
  return (
    <section className="ft-update" aria-labelledby="channels-title">
      <div className="ft-update-head">
        <div>
          <h2 id="channels-title" className="fc-section-title">
            Permanent channels
          </h2>
          <p className="fc-section-hint" style={{ margin: 0 }}>
            Comes from {origin(source.data)}. Each channel takes only releases
            {source.data.kind === "repo" ? " of the branch it follows" : " of the marketplace"},
            with its own database.
          </p>
        </div>
      </div>
      {channels.map((channel) => (
        <Channel
          key={`${channel.name}:${channel.update?.version ?? "none"}`}
          tool={tool}
          api={api}
          kind={source.data!.kind}
          channel={channel}
          onChanged={changed}
          {...(onRemove && channel.name !== "production"
            ? { onRemove: () => onRemove(channel.name) }
            : {})}
        />
      ))}
      <AddChannel tool={tool} api={api} kind={source.data.kind} onAdded={changed} />
    </section>
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

const title = (name: string) => (name === "production" ? "Production" : name);

function Channel({
  tool,
  api,
  kind,
  channel,
  onChanged,
  onRemove,
}: {
  tool: string;
  api: Api;
  kind: ToolSourceView["kind"];
  channel: ChannelView;
  onChanged: () => void;
  onRemove?: () => void;
}) {
  const [approve, setApprove] = useState(false);
  const [destructive, setDestructive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const { update } = channel;
  const plan = update?.plan;
  const needsApproval = (update?.approvals.length ?? 0) > 0;
  // An approval is the admin's to give here; anything else is fixed on the branch, in Git.
  const problems = plan?.conflicts.filter((c) => c.code !== "PENDING_APPROVAL") ?? [];
  const dropsData = plan?.requiresAllowDestructive === true;
  const ready =
    update !== null &&
    problems.length === 0 &&
    (!needsApproval || approve) &&
    (!dropsData || destructive);
  const label = title(channel.name);

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
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plan?.prompt ?? "");
      setCopied(true);
    } catch {
      setError("The prompt could not be copied: select it below and copy it.");
    }
  };

  return (
    <div className="ft-update-card" aria-label={`Channel ${label}`}>
      <div className="ft-update-head">
        <p className="ft-release-head" style={{ margin: 0 }}>
          <strong>{label}</strong>
          {channel.follows ? (
            <span className="fc-muted">
              {" "}
              follows <code>{channel.follows}</code>
            </span>
          ) : null}
          <span className="fc-muted">
            {" · "}
            {channel.serves ? (
              <>
                serves <code>{channel.serves}</code>
              </>
            ) : (
              "serves nothing yet"
            )}
          </span>
        </p>
        <div style={{ display: "flex", gap: "var(--space-2, 8px)", alignItems: "center" }}>
          <Checkbox
            label={
              <>
                Update by itself{" "}
                <span className="fc-muted">
                  A release that asks for nothing new goes on its own.
                </span>
              </>
            }
            checked={channel.autoUpdate}
            disabled={busy}
            onChange={(e) =>
              act(
                () => saveChannel(api, tool, channel.name, { autoUpdate: e.target.checked }),
                "The setting was not saved. Try again.",
              )
            }
          />
          {onRemove ? (
            <Button size="sm" variant="ghost" onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {update ? (
        <>
          <p className="ft-release-head" style={{ margin: 0 }}>
            <span>
              Release available: <code>{update.version}</code>
              {update.branch ? (
                <span className="fc-muted">
                  {" "}
                  from <code>{update.branch}</code>
                </span>
              ) : null}
            </span>
            <Badge tone="success">Release</Badge>
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
          {plan && problems.length === 0 && plan.migrations.pending.length > 0 ? (
            <p style={{ margin: 0 }}>
              <span className="fc-caption">Migrations that will run</span>{" "}
              <span className="fc-mono">{plan.migrations.pending.join(", ")}</span>
            </p>
          ) : null}
          {problems.length === 0 && dropsData ? (
            <Notice tone="warning" title="It drops or rewrites data.">
              {plan!.migrations.destructive.join(", ")} cannot be undone on {label}&apos;s data.
              <Checkbox
                label="Run it: the data it drops is gone"
                checked={destructive}
                onChange={(e) => setDestructive(e.target.checked)}
              />
            </Notice>
          ) : null}
          {problems.length > 0 ? (
            <div className="ft-release" role="alert">
              <Notice
                tone="danger"
                title={`This release cannot go to ${label} yet (${problems.length} problem${problems.length === 1 ? "" : "s"}).`}
              >
                <ul className="ft-entries">
                  {problems.map((c, i) => (
                    <li key={i}>
                      <span className="fc-mono">{c.code}</span>
                      {c.subject ? <span className="fc-mono fc-muted"> {c.subject}</span> : null}
                      {": "}
                      {c.message}
                    </li>
                  ))}
                </ul>
              </Notice>
              <p style={{ margin: 0 }}>
                Fix it on the branch {channel.follows ? <code>{channel.follows}</code> : null} in
                Git, then release again, or hand it to an agent: copy the prompt, open Claude Code
                in this tool&apos;s folder and paste it.
              </p>
              {plan?.prompt ? (
                <div>
                  <Button onClick={copy}>{copied ? "Copied" : "Copy prompt for your agent"}</Button>
                  <details>
                    <summary>Read the prompt</summary>
                    <pre className="fc-mono" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                      {plan.prompt}
                    </pre>
                  </details>
                </div>
              ) : null}
              <CopyBlock
                label="See what the channel's database has applied"
                value={
                  channel.name === "production"
                    ? "forgeron db status --env production"
                    : `forgeron db status --channel ${channel.name}`
                }
                prefix="$"
              />
            </div>
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
                      ...(channel.name === "production" ? {} : { channel: channel.name }),
                      ...(needsApproval ? { approve: true } : {}),
                      ...(dropsData ? { allowDestructive: true } : {}),
                    }),
                  `The update did not reach ${label}. Try again.`,
                )
              }
            >
              {busy ? "Updating…" : `Update ${label}`}
            </Button>
          </div>
        </>
      ) : (
        <p className="fc-muted" style={{ margin: 0 }}>
          {kind === "repo" && channel.follows
            ? `Up to date with the releases of ${channel.follows}.`
            : "Up to date."}
        </p>
      )}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}

/** An admin adds a permanent channel: a name, the branch it follows, whether it updates by itself. */
function AddChannel({
  tool,
  api,
  kind,
  onAdded,
}: {
  tool: string;
  api: Api;
  kind: ToolSourceView["kind"];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [follows, setFollows] = useState("");
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  if (!open) {
    return (
      <div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Add a channel
        </Button>
      </div>
    );
  }
  const repo = kind === "repo";
  const valid = CHANNEL.test(name) && name !== "production" && (!repo || follows.trim().length > 0);
  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await addChannel(api, tool, {
        name,
        ...(repo ? { follows: follows.trim() } : {}),
        ...(auto ? { autoUpdate: true } : {}),
      });
      setOpen(false);
      setName("");
      setFollows("");
      onAdded();
    } catch (e) {
      setError(explain(e, "The channel was not added. Try again."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="ft-update-card"
      aria-label="Add a channel"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void save();
      }}
    >
      <Field
        label="Name"
        hint="Lowercase letters, digits and '-': staging, recette. It answers at /t/<tool>~<name>/."
      >
        {(control) => (
          <Input
            {...control}
            mono
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-autofocus
          />
        )}
      </Field>
      {repo ? (
        <Field label="Follows the branch" hint="It takes only the releases made on this branch.">
          {(control) => (
            <Input
              {...control}
              mono
              autoComplete="off"
              value={follows}
              onChange={(e) => setFollows(e.target.value)}
            />
          )}
        </Field>
      ) : null}
      <Checkbox
        label="Update by itself"
        checked={auto}
        onChange={(e) => setAuto(e.target.checked)}
      />
      <p className="fc-muted" style={{ margin: 0 }}>
        It gets its own database, empty, and starts as a draft: publish it from the header to share
        it.
      </p>
      <div style={{ display: "flex", gap: "var(--space-2, 8px)" }}>
        <Button variant="primary" type="submit" disabled={busy || !valid}>
          {busy ? "Adding…" : "Add channel"}
        </Button>
        <Button type="button" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </form>
  );
}
