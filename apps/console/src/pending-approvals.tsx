import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient, typedSender, type SendJson } from "./api";
import { Badge, Button, Table, type TableColumn } from "@forgeron/ui";

// The versions that wait for an admin: what each asks for, and a way to decide (docs/sdk.md
// section 3, "When a new version asks for more"). A version that is not approved reaches preview,
// not production.

export interface RequestedResource {
  /** The request to decide. */
  id: string;
  /** `resources.network`, `resources.connectors.hubspot`. */
  resource: string;
  kind: "added" | "broadened";
}

export interface PendingVersion {
  id: string;
  tool: string;
  version: string;
  requests: RequestedResource[];
}

/**
 * Asks the platform for the versions that wait, across the workspace's tools. Only what the screen
 * shows is kept; a change that is neither an addition nor a broadening is not a request and is dropped.
 */
export async function loadPendingApprovals(
  fetchJson: (path: string) => Promise<unknown>,
): Promise<PendingVersion[]> {
  const body = ok(await typedClient(fetchJson)(addresses.listApprovals));
  return (body.versions ?? []).map((entry) => ({
    id: String(entry.id),
    tool: String(entry.tool),
    version: String(entry.version),
    requests: (entry.approvals ?? []).flatMap((a) => {
      const kind =
        a.kind === "resource.added"
          ? "added"
          : a.kind === "resource.broadened"
            ? "broadened"
            : undefined;
      return kind
        ? [{ id: String(a.id), resource: String(a.resource), kind } as RequestedResource]
        : [];
    }),
  }));
}

/** Decides each request of a version, one after the other: the first refusal stops the rest. */
export async function decideVersion(
  sendJson: SendJson,
  version: PendingVersion,
  decision: "approved" | "rejected",
): Promise<void> {
  for (const request of version.requests) {
    ok(
      await typedSender(sendJson)(addresses.decideApproval, {
        params: { id: request.id },
        json: { decision },
      }),
    );
  }
}

export interface PendingApprovalsProps {
  versions: ReadonlyArray<PendingVersion>;
  /** Called with the version to approve or reject; the screen only draws the buttons when given. */
  onApprove?: (version: PendingVersion) => void;
  onReject?: (version: PendingVersion) => void;
}

export function PendingApprovals({ versions, onApprove, onReject }: PendingApprovalsProps) {
  const columns: Array<TableColumn<PendingVersion>> = [
    { key: "tool", header: "Tool", mono: true },
    { key: "version", header: "Version", mono: true },
    {
      key: "requests",
      header: "Asks for",
      render: (row) => (
        <ul className="fc-badges" style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {row.requests.map((request) => (
            <li key={request.resource}>
              <code>{request.resource}</code>{" "}
              <Badge tone={request.kind === "added" ? "neutral" : "warning"}>{request.kind}</Badge>
            </li>
          ))}
        </ul>
      ),
    },
    ...(onApprove || onReject
      ? [
          {
            key: "decide",
            header: "",
            render: (row: PendingVersion) => (
              <div className="fc-cell-actions">
                {onReject ? (
                  <Button variant="ghost" size="sm" onClick={() => onReject(row)}>
                    Reject
                  </Button>
                ) : null}
                {onApprove ? (
                  <Button variant="primary" size="sm" onClick={() => onApprove(row)}>
                    Approve
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ];
  return (
    <Table
      columns={columns}
      rows={versions}
      rowKey={(row) => row.id}
      empty="No version is waiting for approval."
    />
  );
}
