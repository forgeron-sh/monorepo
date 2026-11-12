import { Button, Checkbox, CopyBlock, Dialog, Field, Input, Notice, Textarea } from "@forgeron/ui";
import { useState } from "react";
import { ApiError, explain, type Api } from "../../api";
import { useLoad } from "../../use-load";
import {
  closePreview,
  promote,
  promotionPlan,
  rollback,
  type ChangelogEntry,
  type Impact,
  type VersionRow,
} from "./api";
import { ImpactBadge } from "./components";

// Promote and Roll back, in the manner of Vercel's instant rollback: what goes in, what comes out,
// what the change contains, why, and what is not undone. Both call the platform's own routes with the
// person's session; the platform checks the changelog and the approvals again and says why it refuses.
// What a version asks for is approved here, in the same step (D-121): there is no screen of approvals.
// A build with no release can go too, once the admin says so. When the plan did not say it and the
// platform refuses the promotion for one of these two reasons, the dialog offers the same choice.

export interface ReleaseDialogProps {
  kind: "promote" | "rollback";
  tool: string;
  api: Api;
  /** What production serves now; `null` when nothing is deployed there yet. */
  from: string | null;
  /** The version production will serve. */
  to: string;
  /** The branch it comes from, to word the command that fixes a conflict. */
  branch?: string;
  /** The tool's versions, to read the changelog from; `undefined` when they could not be loaded. */
  versions?: ReadonlyArray<VersionRow>;
  onClose: () => void;
  /** The platform did it: the screen reloads what it shows. */
  onDone: () => void;
}

/** What a version carries: its entries and how strong its change is. */
function contents(version: VersionRow | undefined): { entries: ChangelogEntry[]; impact: Impact } {
  if (!version) return { entries: [], impact: "none" };
  const declared = version.changelog?.declared ?? "none";
  return {
    entries: version.changelog?.entries ?? [],
    impact: declared !== "none" ? declared : version.impact,
  };
}

export function ReleaseDialog({
  kind,
  tool,
  api,
  from,
  to,
  branch,
  versions,
  onClose,
  onDone,
}: ReleaseDialogProps) {
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const promoting = kind === "promote";
  // Promoting asks for the plan first (D-113): can it go, and what stops it. A rollback has none. When the
  // platform gives no plan the dialog behaves as before: the platform checks again when it acts.
  const planned = useLoad(
    async () => (promoting ? await promotionPlan(api, { tool, version: to }) : undefined),
    [api, tool, to, promoting],
  );
  const plan = planned.data;
  const [approve, setApprove] = useState(false);
  const [withoutRelease, setWithoutRelease] = useState(false);
  // What the platform refused on the last try, when the plan had not said it: the admin may accept it.
  const [refused, setRefused] = useState<{ noRelease?: true; approval?: string }>({});
  // An approval and a missing release are the admin's to accept here; anything else is fixed elsewhere.
  const asks = plan?.conflicts.filter((c) => c.code === "PENDING_APPROVAL") ?? [];
  const approving = asks.length > 0 || refused.approval !== undefined;
  const noRelease =
    (plan?.conflicts.some((c) => c.code === "CHANGELOG_NO_ENTRY") ?? false) ||
    refused.noRelease === true;
  const problems =
    plan?.conflicts.filter(
      (c) => c.code !== "PENDING_APPROVAL" && c.code !== "CHANGELOG_NO_ENTRY",
    ) ?? [];
  const blocked =
    promoting &&
    (problems.length > 0 ||
      plan?.requiresAllowDestructive === true ||
      (approving && !approve) ||
      (noRelease && !withoutRelease));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plan?.prompt ?? "");
      setCopied(true);
    } catch {
      setError("The prompt could not be copied: select it below and copy it.");
    }
  };

  // Promoting brings in the changelog of `to`; rolling back takes out the one of `from`.
  const shown = versions?.find((v) => v.version === (promoting ? to : from));
  const { entries, impact } = contents(shown);

  const run = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (promoting) {
        await promote(api, {
          tool,
          version: to,
          reason: reason.trim(),
          ...(approving && approve ? { approve: true } : {}),
          ...(noRelease && withoutRelease ? { withoutRelease: true } : {}),
        });
      } else await rollback(api, { tool, reason: reason.trim() });
      onDone();
    } catch (failure) {
      // A build with no release, or an approval: the admin's to accept, so the dialog asks for it.
      const code = failure instanceof ApiError ? failure.code : undefined;
      if (promoting && code === "NO_ENTRY" && !noRelease) {
        setRefused((r) => ({ ...r, noRelease: true }));
      } else if (promoting && code === "PENDING_APPROVAL" && !approving) {
        const said = failure instanceof ApiError ? failure.detail : undefined;
        setRefused((r) => ({ ...r, approval: said ?? "" }));
      } else {
        setError(
          explain(failure, "The platform did not answer. Check your connection, then try again."),
        );
      }
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={promoting ? "Promote to production" : "Roll back production"}
      description={
        promoting
          ? `Production will serve ${to} from now on, without a rebuild.`
          : `Production will serve ${to} again, without a rebuild.`
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={run}
            disabled={busy || blocked || (promoting && planned.loading)}
            data-autofocus
          >
            {busy ? "Working" : promoting ? "Promote" : "Roll back"}
          </Button>
        </>
      }
    >
      <div className="ft-release">
        <div className="ft-versions" aria-label="From and to">
          <div>
            <span className="fc-caption">From</span>
            <code>{from ?? "nothing yet"}</code>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <span className="fc-caption">To</span>
            <code>{to}</code>
          </div>
        </div>

        <div>
          <p className="ft-release-head">
            <span className="fc-caption" style={{ margin: 0 }}>
              {promoting ? "What goes live" : "What leaves production"}
            </span>
            {versions ? <ImpactBadge impact={impact} /> : null}
          </p>
          {versions === undefined ? (
            <p className="fc-muted" style={{ margin: 0 }}>
              The changelog could not be loaded. The platform still checks it before it acts.
            </p>
          ) : entries.length === 0 ? (
            <p className="fc-muted" style={{ margin: 0 }}>
              No changelog entry for {promoting ? to : from}.
            </p>
          ) : (
            <ul className="ft-entries">
              {entries.map((entry, i) => (
                <li key={i}>
                  <span className="fc-mono fc-muted">{entry.type}</span> {entry.description}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Field label="Reason" hint="Written in the tool's activity. Optional.">
          {(control) => (
            <Textarea
              {...control}
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>

        {promoting && planned.loading ? (
          <p className="fc-muted" style={{ margin: 0 }}>
            Checking that it can go: the migrations, the changelog, the approvals.
          </p>
        ) : null}
        {plan?.alreadyServed ? (
          <Notice tone="info" title="Production already serves this version.">
            Promoting it again changes nothing.
          </Notice>
        ) : null}
        {promoting && approving ? (
          <div className="ft-asks">
            <span className="fc-caption">This version asks for</span>
            {asks.length > 0 ? (
              <ul className="ft-entries">
                {asks.map((a) => (
                  <li key={a.subject} className="fc-mono">
                    {a.subject}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>
                {refused.approval || "Something an admin has not approved yet."}
              </p>
            )}
            <Checkbox
              label="I approve what it asks for"
              checked={approve}
              onChange={(e) => setApprove(e.target.checked)}
            />
          </div>
        ) : null}
        {promoting && noRelease ? (
          <Notice tone="warning" title="This build is not a release.">
            It has no changelog: the people who use the tool will not know what changes. Make a
            release with <span className="fc-mono">forgeron change</span> and{" "}
            <span className="fc-mono">forgeron release</span>, or put it in production as it is.
            <Checkbox
              label="Put it in production without a release"
              checked={withoutRelease}
              onChange={(e) => setWithoutRelease(e.target.checked)}
            />
          </Notice>
        ) : null}
        {plan && problems.length === 0 && plan.migrations.pending.length > 0 ? (
          <p style={{ margin: 0 }}>
            <span className="fc-caption">Migrations that will run</span>{" "}
            <span className="fc-mono">{plan.migrations.pending.join(", ")}</span>
          </p>
        ) : null}
        {plan && problems.length === 0 && plan.requiresAllowDestructive ? (
          <Notice tone="warning" title="It drops or rewrites data.">
            {plan.migrations.destructive.join(", ")} cannot run from here. Read it, then promote
            from a terminal with <span className="fc-mono">--allow-destructive</span>.
          </Notice>
        ) : null}
        {plan && problems.length > 0 ? (
          <div className="ft-release" role="alert">
            <Notice
              tone="danger"
              title={`This version cannot go to production yet (${problems.length} problem${problems.length === 1 ? "" : "s"}).`}
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
              Fix it from the terminal with the CLI, or hand it to an agent: copy the prompt, open
              Claude Code in this tool&apos;s folder and paste it.
            </p>
            {plan.prompt ? (
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
              label="See what the production database has applied"
              value="forgeron db status --env production"
              prefix="$"
            />
            <CopyBlock
              label="Then try again"
              value={`forgeron promote ${branch ? `--from-branch ${branch}` : to} --to production`}
              prefix="$"
            />
          </div>
        ) : null}

        <Notice tone="info" title="Migrations are not rolled back.">
          Only the code changes. A migration that already ran stays applied, and the other version
          must work with it.
        </Notice>
        {error ? (
          <Notice tone="danger" title="The platform refused.">
            {error}
          </Notice>
        ) : null}
      </div>
    </Dialog>
  );
}

export interface ClosePreviewDialogProps {
  tool: string;
  branch: string;
  api: Api;
  onClose: () => void;
  onDone: () => void;
}

/** Closing a preview deletes its Worker and its database: the branch's name is typed to confirm. */
export function ClosePreviewDialog({
  tool,
  branch,
  api,
  onClose,
  onDone,
}: ClosePreviewDialogProps) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await closePreview(api, { tool, branch });
      onDone();
    } catch (failure) {
      setError(
        explain(failure, "The platform did not answer. Check your connection, then try again."),
      );
      setBusy(false);
    }
  };
  return (
    <Dialog
      title="Close preview"
      description={`The preview of ${branch} stops answering, and its Worker and its database are deleted. Pushing the branch again creates a new one.`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={run} disabled={busy || typed !== branch}>
            {busy ? "Working" : "Close preview"}
          </Button>
        </>
      }
    >
      <div className="ft-release">
        <Field label={`Type ${branch} to confirm`}>
          {(control) => (
            <Input
              {...control}
              mono
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              data-autofocus
            />
          )}
        </Field>
        {error ? (
          <Notice tone="danger" title="The preview could not be closed.">
            {error}
          </Notice>
        ) : null}
      </div>
    </Dialog>
  );
}
