import { Badge, Button, Table, type TableColumn } from "@forgeron/ui";

// The versions that wait for an admin: what each asks for, and a way to approve it (docs/sdk.md
// section 3, "When a new version asks for more"). A version that is not approved reaches preview,
// not pilot or production.

export interface RequestedResource {
  /** `resources.network`, `resources.connectors.hubspot`. */
  resource: string;
  kind: "added" | "broadened";
}

export interface PendingVersion {
  id: string;
  version: string;
  requests: RequestedResource[];
}

/**
 * Asks the platform for the pending versions of a tool. Only what the screen shows is kept; a
 * change that is neither an addition nor a broadening is not a request and is dropped.
 */
export async function loadPendingApprovals(
  fetchJson: (path: string) => Promise<unknown>,
  tool: string,
): Promise<PendingVersion[]> {
  const body = (await fetchJson(`/api/tools/${tool}/approvals`)) as {
    versions?: Array<{
      id?: unknown;
      version?: unknown;
      approvals?: Array<{ resource?: unknown; kind?: unknown }>;
    }>;
  };
  return (body.versions ?? []).map((entry) => ({
    id: String(entry.id),
    version: String(entry.version),
    requests: (entry.approvals ?? []).flatMap((a) => {
      const kind =
        a.kind === "resource.added"
          ? "added"
          : a.kind === "resource.broadened"
            ? "broadened"
            : undefined;
      return kind ? [{ resource: String(a.resource), kind } as RequestedResource] : [];
    }),
  }));
}

export interface PendingApprovalsProps {
  versions: ReadonlyArray<PendingVersion>;
  /** Called with the version to approve; the screen only draws the button when it is given. */
  onApprove?: (version: PendingVersion) => void;
}

export function PendingApprovals({ versions, onApprove }: PendingApprovalsProps) {
  const columns: Array<TableColumn<PendingVersion>> = [
    { key: "version", header: "Version", mono: true },
    {
      key: "requests",
      header: "Asks for",
      render: (row) => (
        <ul>
          {row.requests.map((request) => (
            <li key={request.resource}>
              <code>{request.resource}</code>{" "}
              <Badge tone={request.kind === "added" ? "neutral" : "warning"}>{request.kind}</Badge>
            </li>
          ))}
        </ul>
      ),
    },
    ...(onApprove
      ? [
          {
            key: "approve",
            header: "",
            render: (row: PendingVersion) => (
              <Button variant="primary" size="sm" onClick={() => onApprove(row)}>
                Approve
              </Button>
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
