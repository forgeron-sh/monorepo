import { Badge, Button, Table, type TableColumn } from "@forgeron/ui";

// Which roles may call which actions of a tool, and a way to change it without a new version
// (docs/sdk.md section 3). A cell shows what applies; one an admin changed says so.

export interface AccessCell {
  allowed: boolean;
  /** Set by an admin, as opposed to what the role's levels say. */
  changed: boolean;
}

export interface AccessMatrixData {
  roles: string[];
  actions: string[];
  cells: Record<string, Record<string, AccessCell>>;
}

/** Asks the platform for a tool's matrix. Only what the screen draws is kept. */
export async function loadAccessMatrix(
  fetchJson: (path: string) => Promise<unknown>,
  tool: string,
): Promise<AccessMatrixData> {
  const body = (await fetchJson(`/api/tools/${tool}/access-matrix`)) as {
    roles?: unknown[];
    actions?: unknown[];
    cells?: Record<string, Record<string, { allowed?: unknown; override?: unknown }>>;
  };
  const roles = (body.roles ?? []).map(String);
  const actions = (body.actions ?? []).map(String);
  const cells: AccessMatrixData["cells"] = {};
  for (const role of roles) {
    cells[role] = Object.fromEntries(
      actions.map((action) => {
        const cell = body.cells?.[role]?.[action];
        return [action, { allowed: cell?.allowed === true, changed: cell?.override !== undefined }];
      }),
    );
  }
  return { roles, actions, cells };
}

export interface AccessMatrixProps {
  matrix: AccessMatrixData;
  /** Called with the cell to flip; the screen only draws the buttons when it is given. */
  onToggle?: (change: { role: string; action: string; allowed: boolean }) => void;
}

interface Row {
  role: string;
}

export function AccessMatrix({ matrix, onToggle }: AccessMatrixProps) {
  const columns: Array<TableColumn<Row>> = [
    { key: "role", header: "Role", mono: true },
    ...matrix.actions.map((action) => ({
      key: action,
      header: action,
      render: ({ role }: Row) => {
        const cell = matrix.cells[role]?.[action] ?? { allowed: false, changed: false };
        const badge = (
          <Badge tone={cell.allowed ? "success" : "neutral"} dot>
            {cell.allowed ? "allowed" : "refused"}
            {cell.changed ? " (changed)" : ""}
          </Badge>
        );
        return onToggle ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle({ role, action, allowed: !cell.allowed })}
          >
            {badge}
          </Button>
        ) : (
          badge
        );
      },
    })),
  ];
  return (
    <Table
      columns={columns}
      rows={matrix.roles.map((role) => ({ role }))}
      rowKey={(row) => row.role}
      empty="This tool declares no role."
    />
  );
}
