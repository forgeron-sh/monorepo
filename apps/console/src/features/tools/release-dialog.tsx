import { Button, Dialog, Field, Input, Notice, Textarea } from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../api";
import {
  closePreview,
  removeChannel,
  rollback,
  type ChangelogEntry,
  type Impact,
  type VersionRow,
} from "./api";
import { ImpactBadge } from "./components";

// Roll back a permanent channel, in the manner of Vercel's instant rollback: what comes back, what
// leaves, why, and what is not undone. The channel goes back to a release it served: no new code
// (D-125). There is no promotion between branches: a permanent channel takes the releases of the
// branch it follows, through its update. The platform checks again and says why it refuses.

export interface RollbackDialogProps {
  tool: string;
  api: Api;
  /** The permanent channel: production, or another one by its name. */
  channel: string;
  /** What the channel serves now. */
  from: string | null;
  /** The version it will serve again. */
  to: string;
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

const named = (channel: string) => (channel === "production" ? "production" : channel);

export function RollbackDialog({
  tool,
  api,
  channel,
  from,
  to,
  versions,
  onClose,
  onDone,
}: RollbackDialogProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  // Rolling back takes out the changelog of what the channel serves now.
  const shown = versions?.find((v) => v.version === from);
  const { entries, impact } = contents(shown);

  const run = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await rollback(api, { tool, reason: reason.trim(), channel });
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
      title={`Roll back ${named(channel)}`}
      description={`${channel === "production" ? "Production" : `The channel ${channel}`} will serve ${to} again, a release it served before, without a rebuild.`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={run} disabled={busy} data-autofocus>
            {busy ? "Working" : "Roll back"}
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
              What leaves {named(channel)}
            </span>
            {versions ? <ImpactBadge impact={impact} /> : null}
          </p>
          {versions === undefined ? (
            <p className="fc-muted" style={{ margin: 0 }}>
              The changelog could not be loaded.
            </p>
          ) : entries.length === 0 ? (
            <p className="fc-muted" style={{ margin: 0 }}>
              No changelog entry for {from}.
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

export interface RemoveChannelDialogProps {
  tool: string;
  channel: string;
  api: Api;
  onClose: () => void;
  onDone: () => void;
}

/**
 * Removing a permanent channel deletes its Worker and its database, for good: its name is typed to
 * confirm. Production is never removed.
 */
export function RemoveChannelDialog({
  tool,
  channel,
  api,
  onClose,
  onDone,
}: RemoveChannelDialogProps) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await removeChannel(api, tool, channel);
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
      title={`Remove the channel ${channel}`}
      description={`${channel} stops answering, and its Worker and its database are deleted, with its data. Production is not touched.`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={run} disabled={busy || typed !== channel}>
            {busy ? "Working" : "Remove channel"}
          </Button>
        </>
      }
    >
      <div className="ft-release">
        <Field label={`Type ${channel} to confirm`}>
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
          <Notice tone="danger" title="The channel could not be removed.">
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

/**
 * Closing a branch's temporary channel deletes its Worker and its database: the branch's name is typed
 * to confirm. The branch itself stays on GitHub: Forgeron never touches it.
 */
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
      title="Close the branch's channel"
      description={`The temporary channel of ${branch} stops answering, and its Worker and its database are deleted. Pushing the branch again creates a new one.`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={run} disabled={busy || typed !== branch}>
            {busy ? "Working" : "Close channel"}
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
          <Notice tone="danger" title="The channel could not be closed.">
            {error}
          </Notice>
        ) : null}
      </div>
    </Dialog>
  );
}
