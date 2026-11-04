import { Button, Dialog, Field, Input, Notice, Textarea } from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../api";
import {
  closePreview,
  promote,
  rollback,
  type ChangelogEntry,
  type Impact,
  type VersionRow,
} from "./api";
import { ImpactBadge } from "./components";

// Promote and Roll back, in the manner of Vercel's instant rollback: what goes in, what comes out,
// what the change contains, why, and what is not undone. Both call the platform's own routes with the
// person's session; the platform checks the changelog and the approvals again and says why it refuses.

export interface ReleaseDialogProps {
  kind: "promote" | "rollback";
  tool: string;
  api: Api;
  /** What production serves now; `null` when nothing is deployed there yet. */
  from: string | null;
  /** The version production will serve. */
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

export function ReleaseDialog({
  kind,
  tool,
  api,
  from,
  to,
  versions,
  onClose,
  onDone,
}: ReleaseDialogProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const promoting = kind === "promote";

  // Promoting brings in the changelog of `to`; rolling back takes out the one of `from`.
  const shown = versions?.find((v) => v.version === (promoting ? to : from));
  const { entries, impact } = contents(shown);

  const run = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (promoting) await promote(api, { tool, version: to, reason: reason.trim() });
      else await rollback(api, { tool, reason: reason.trim() });
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
          <Button variant="primary" onClick={run} disabled={busy} data-autofocus>
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
