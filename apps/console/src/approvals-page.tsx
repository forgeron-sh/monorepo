import { Button, Dialog, EmptyState, Notice, Page } from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "./api";
import {
  decideVersion,
  loadPendingApprovals,
  PendingApprovals,
  type PendingVersion,
} from "./pending-approvals";
import { Loading, LoadError } from "./states";
import { useLoad } from "./use-load";

// Versions that ask for more than the last one did (a network host, a connector) wait here for an
// admin. Deciding is confirmed: an approval widens what a tool may reach.

export function ApprovalsPage({ api, onDecided }: { api: Api; onDecided?: () => void }) {
  const pending = useLoad(() => loadPendingApprovals(api.fetchJson), [api]);
  const [asking, setAsking] = useState<{
    version: PendingVersion;
    decision: "approved" | "rejected";
  }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const confirm = async () => {
    if (!asking) return;
    setBusy(true);
    setError(undefined);
    try {
      await decideVersion(api.sendJson, asking.version, asking.decision);
      setAsking(undefined);
      pending.reload();
      onDecided?.();
    } catch (e) {
      setError(explain(e, "The decision was not saved. Try again."));
    } finally {
      setBusy(false);
    }
  };
  const approve = asking?.decision === "approved";

  return (
    <Page
      title="Approvals"
      description="Versions that ask for more access than the last one wait here. Until you decide, they reach preview only."
    >
      {pending.loading ? (
        <Loading label="Loading approvals" />
      ) : pending.error && !pending.data ? (
        <LoadError what="The approvals" error={pending.error} onRetry={pending.reload} />
      ) : pending.data && pending.data.length === 0 ? (
        <EmptyState
          title="Nothing is waiting"
          description="When a new version asks for a resource the last one did not have, it shows up here."
        />
      ) : (
        <PendingApprovals
          versions={pending.data ?? []}
          onApprove={(version) => setAsking({ version, decision: "approved" })}
          onReject={(version) => setAsking({ version, decision: "rejected" })}
        />
      )}
      {asking ? (
        <Dialog
          title={`${approve ? "Approve" : "Reject"} ${asking.version.tool} ${asking.version.version}?`}
          description={
            approve
              ? "This version may then reach pilot and production with the access it asks for."
              : "This version stays on preview. You can still decide again by deploying a new version."
          }
          onClose={() => !busy && setAsking(undefined)}
          footer={
            <>
              <Button onClick={() => setAsking(undefined)} disabled={busy}>
                Cancel
              </Button>
              <Button
                variant={approve ? "primary" : "danger"}
                onClick={confirm}
                disabled={busy}
                data-autofocus
              >
                {approve ? "Approve" : "Reject"}
              </Button>
            </>
          }
        >
          <ul style={{ margin: 0, paddingLeft: "var(--space-4)" }}>
            {asking.version.requests.map((r) => (
              <li key={r.id}>
                <code>{r.resource}</code> ({r.kind})
              </li>
            ))}
          </ul>
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </Dialog>
      ) : null}
    </Page>
  );
}
