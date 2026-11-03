import { Badge, Button, Table, type TableColumn } from "@forgeron/ui";
import { useEffect, useState } from "react";

// Which roles may call which actions of a tool, and a way to change it without a new version
// (docs/sdk.md section 3). A cell shows what applies; one that differs from what the manifest's
// access levels say (its default) says so. Edits are drafted on the screen and sent on Save.

export interface AccessCell {
  allowed: boolean;
  /** What the manifest's levels say for this role and action. */
  default: boolean;
  /** Applies something other than the default: an admin changed it (or has a draft for it). */
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
    cells?: Record<string, Record<string, { allowed?: unknown; default?: unknown }>>;
  };
  const roles = (body.roles ?? []).map(String);
  const actions = (body.actions ?? []).map(String);
  const cells: AccessMatrixData["cells"] = {};
  for (const role of roles) {
    cells[role] = Object.fromEntries(
      actions.map((action) => {
        const cell = body.cells?.[role]?.[action];
        const allowed = cell?.allowed === true;
        const fallback = cell?.default === true;
        return [action, { allowed, default: fallback, changed: allowed !== fallback }];
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
        const cell = matrix.cells[role]?.[action] ?? {
          allowed: false,
          default: false,
          changed: false,
        };
        const badge = (
          <Badge tone={cell.allowed ? "success" : "neutral"} dot>
            {cell.allowed ? "allowed" : "refused"}
            {cell.changed ? ` (default: ${cell.default ? "allowed" : "refused"})` : ""}
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

export interface CellChange {
  role: string;
  action: string;
  allowed: boolean;
}

/**
 * Sends the drafted cells one by one. A cell back at its default is sent as `null` so that the
 * platform drops the override instead of storing one equal to the default.
 */
export async function saveAccessMatrix(
  sendJson: (path: string, body: unknown) => Promise<unknown>,
  tool: string,
  matrix: AccessMatrixData,
  changes: CellChange[],
): Promise<void> {
  for (const { role, action, allowed } of changes) {
    const fallback = matrix.cells[role]?.[action]?.default;
    await sendJson(`/api/tools/${tool}/access-matrix`, {
      role,
      action,
      allowed: allowed === fallback ? null : allowed,
    });
  }
}

/** Applies the drafted flips on top of a loaded matrix. */
export function withDraft(
  matrix: AccessMatrixData,
  draft: Map<string, CellChange>,
): AccessMatrixData {
  const cells: AccessMatrixData["cells"] = {};
  for (const role of matrix.roles) {
    cells[role] = Object.fromEntries(
      matrix.actions.map((action) => {
        const cell = matrix.cells[role]![action]!;
        const allowed = draft.get(`${role}\u0000${action}`)?.allowed ?? cell.allowed;
        return [action, { ...cell, allowed, changed: allowed !== cell.default }];
      }),
    );
  }
  return { ...matrix, cells };
}

export interface AccessMatrixEditorProps {
  tool: string;
  fetchJson: (path: string) => Promise<unknown>;
  sendJson: (path: string, body: unknown) => Promise<unknown>;
}

/** The matrix of a tool with Save: for an admin (the platform refuses anyone else). */
export function AccessMatrixEditor({ tool, fetchJson, sendJson }: AccessMatrixEditorProps) {
  const [loaded, setLoaded] = useState<AccessMatrixData>();
  const [draft, setDraft] = useState(new Map<string, CellChange>());
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string>();

  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    loadAccessMatrix(fetchJson, tool).then(
      (matrix) => {
        if (!current) return;
        setLoaded(matrix);
        setDraft(new Map());
      },
      (e: unknown) => {
        if (!current) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      },
    );
    return () => {
      current = false;
    };
  }, [tool, fetchJson, reload]);

  if (!loaded) return <p>{status === "error" ? `Could not load: ${error}` : "Loading…"}</p>;
  const shown = withDraft(loaded, draft);
  return (
    <div>
      <AccessMatrix
        matrix={shown}
        onToggle={(change) => {
          const key = `${change.role}\u0000${change.action}`;
          const next = new Map(draft);
          // Flipping back to what is saved is no change at all.
          if (loaded.cells[change.role]?.[change.action]?.allowed === change.allowed)
            next.delete(key);
          else next.set(key, change);
          setDraft(next);
          setStatus("idle");
        }}
      />
      <Button
        disabled={draft.size === 0 || status === "saving"}
        onClick={async () => {
          setStatus("saving");
          try {
            await saveAccessMatrix(sendJson, tool, loaded, [...draft.values()]);
            setReload((n) => n + 1);
            setStatus("saved");
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setStatus("error");
          }
        }}
      >
        Save
      </Button>
      {status === "saved" ? <p>Saved. It applies to the next call, on every interface.</p> : null}
      {status === "error" ? <p>Not saved: {error}</p> : null}
    </div>
  );
}
