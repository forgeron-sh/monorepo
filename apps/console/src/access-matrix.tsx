import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient, typedSender, type SendJson } from "./api";
import { Badge, Button, Checkbox, Notice, Select, Table, type TableColumn } from "@forgeron/ui";
import { useEffect, useState } from "react";
import { Loading } from "./states";

// Who may use a tool (D-127, D-136), changed without a new version (docs/sdk.md section 3). The tool
// suggests profiles (named sets of its permissions); each subject (Everyone, then each team by name)
// is given a profile, a custom set of permissions, all of them, or nothing. Below, the per-action
// exceptions: a cell shows what applies, and one that differs from what the subject's grant says (its
// default) says so. Edits are drafted on the screen and sent together on Save.

export interface AccessCell {
  allowed: boolean;
  /** What the subject's grant says for this action. */
  default: boolean;
  /** Applies something other than the default: an admin changed it (or has a draft for it). */
  changed: boolean;
  /** What an admin set for this cell, if anything. */
  override?: boolean;
}

/** What a subject is given in the tool. */
export type ProfileGrant =
  | { kind: "all" }
  | { kind: "profile"; profile: string }
  | { kind: "custom"; permissions: string[] }
  | { kind: "none" };

export interface ProfileInfo {
  label?: string;
  grants: string[];
  default: boolean;
}

export interface AccessMatrixData {
  /** The rows: `everyone`, then `team:<id>` by team name. */
  subjects: string[];
  /** What to show for each subject: "Everyone", a team's name. */
  labels: Record<string, string>;
  /** The columns of the exceptions: the actions, then `view:<name>` for each view. */
  columns: string[];
  cells: Record<string, Record<string, AccessCell>>;
  /** The permission each action (or `view:<name>`) requires. */
  levels: Record<string, string>;
  /** Every permission of the tool. */
  permissions: string[];
  profiles: Record<string, ProfileInfo>;
  /** What each subject is given; one not in it is given nothing. */
  grants: Record<string, ProfileGrant>;
}

const NONE: ProfileGrant = { kind: "none" };

const grantOf = (raw: unknown): ProfileGrant => {
  const g = raw as { kind?: unknown; profile?: unknown; permissions?: unknown } | undefined;
  if (g?.kind === "all") return { kind: "all" };
  if (g?.kind === "profile" && typeof g.profile === "string") {
    return { kind: "profile", profile: g.profile };
  }
  if (g?.kind === "custom" && Array.isArray(g.permissions)) {
    return { kind: "custom", permissions: g.permissions.map(String) };
  }
  return NONE;
};

/** The permissions a grant gives in the tool. */
export function permissionsFor(matrix: AccessMatrixData, grant: ProfileGrant): string[] {
  switch (grant.kind) {
    case "all":
      return matrix.permissions;
    case "profile":
      return matrix.profiles[grant.profile]?.grants ?? [];
    case "custom":
      return grant.permissions;
    case "none":
      return [];
  }
}

/** The name of a subject: "Everyone", a team's name; what is not known is shown as it is. */
const subjectLabel = (matrix: Pick<AccessMatrixData, "labels">, subject: string): string =>
  matrix.labels[subject] ?? (subject === "everyone" ? "Everyone" : subject);

/** Asks the platform for a tool's access. Only what the screen draws is kept. */
export async function loadAccessMatrix(
  fetchJson: (path: string) => Promise<unknown>,
  tool: string,
): Promise<AccessMatrixData> {
  const body = ok(await typedClient(fetchJson)(addresses.getAccessMatrix, { params: { tool } }));
  const subjects = (body.subjects ?? []).map(String);
  const columns = (body.columns ?? []).map(String);
  const cells: AccessMatrixData["cells"] = {};
  for (const subject of subjects) {
    cells[subject] = Object.fromEntries(
      columns.map((action) => {
        const cell = body.cells?.[subject]?.[action];
        const allowed = cell?.allowed === true;
        const fallback = cell?.default === true;
        return [
          action,
          {
            allowed,
            default: fallback,
            changed: allowed !== fallback,
            ...(typeof cell?.override === "boolean" ? { override: cell.override } : {}),
          },
        ];
      }),
    );
  }
  const profiles: AccessMatrixData["profiles"] = {};
  for (const [name, p] of Object.entries(body.profiles ?? {})) {
    profiles[name] = {
      ...(p.label ? { label: p.label } : {}),
      grants: (p.grants ?? []).map(String),
      default: p.default === true,
    };
  }
  return {
    subjects,
    labels: { ...body.subjectLabels },
    columns,
    cells,
    levels: { ...body.levels },
    permissions: (body.permissions ?? []).map(String),
    profiles,
    grants: Object.fromEntries(
      Object.entries(body.grants ?? {}).map(([subject, g]) => [subject, grantOf(g)]),
    ),
  };
}

export interface AccessMatrixProps {
  matrix: AccessMatrixData;
  /** Called with the cell to flip; the screen only draws the buttons when it is given. */
  onToggle?: (change: { subject: string; action: string; allowed: boolean }) => void;
}

interface Row {
  subject: string;
}

/** The per-action exceptions: each subject by each action (and view) of the tool. */
export function AccessMatrix({ matrix, onToggle }: AccessMatrixProps) {
  const columns: Array<TableColumn<Row>> = [
    { key: "subject", header: "Who", render: ({ subject }: Row) => subjectLabel(matrix, subject) },
    ...matrix.columns.map((action) => ({
      key: action,
      header: action,
      render: ({ subject }: Row) => {
        const cell = matrix.cells[subject]?.[action] ?? {
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
            onClick={() => onToggle({ subject, action, allowed: !cell.allowed })}
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
      rows={matrix.subjects.map((subject) => ({ subject }))}
      rowKey={(row) => row.subject}
      empty="Nobody is given anything in this tool."
    />
  );
}

/** The value of a row's select for a grant. */
const choiceOf = (grant: ProfileGrant): string =>
  grant.kind === "profile" ? `profile:${grant.profile}` : grant.kind;

const profileName = (matrix: AccessMatrixData, name: string) =>
  matrix.profiles[name]?.label ?? name;

export interface ProfileMappingProps {
  matrix: AccessMatrixData;
  /** Called with the subject's new grant; the screen only draws the controls when it is given. */
  onChange?: (change: { subject: string; grant: ProfileGrant }) => void;
}

/** Everyone and each team by what it is given: a profile, custom permissions, all, or nothing. */
export function ProfileMapping({ matrix, onChange }: ProfileMappingProps) {
  const options = [
    { value: "none", label: "No access" },
    ...Object.keys(matrix.profiles).map((name) => ({
      value: `profile:${name}`,
      label: `Profile: ${profileName(matrix, name)}${matrix.profiles[name]!.default ? " (default)" : ""}`,
    })),
    { value: "custom", label: "Custom permissions" },
    { value: "all", label: "All permissions" },
  ];
  const columns: Array<TableColumn<Row>> = [
    { key: "subject", header: "Who", render: ({ subject }: Row) => subjectLabel(matrix, subject) },
    {
      key: "given",
      header: "Is given",
      render: ({ subject }: Row) => {
        const grant = matrix.grants[subject] ?? NONE;
        if (!onChange) {
          return options.find((o) => o.value === choiceOf(grant))?.label ?? "No access";
        }
        return (
          <Select
            aria-label={`What ${subjectLabel(matrix, subject)} is given`}
            options={options}
            value={choiceOf(grant)}
            onChange={(e) => {
              const value = e.target.value;
              const next: ProfileGrant = value.startsWith("profile:")
                ? { kind: "profile", profile: value.slice("profile:".length) }
                : value === "custom"
                  ? { kind: "custom", permissions: permissionsFor(matrix, grant) }
                  : value === "all"
                    ? { kind: "all" }
                    : NONE;
              onChange({ subject, grant: next });
            }}
          />
        );
      },
    },
    {
      key: "permissions",
      header: "Permissions",
      render: ({ subject }: Row) => {
        const grant = matrix.grants[subject] ?? NONE;
        const held = permissionsFor(matrix, grant);
        if (grant.kind === "custom" && onChange) {
          return (
            <span className="fc-badges">
              {matrix.permissions.map((p) => (
                <Checkbox
                  key={p}
                  label={p}
                  checked={held.includes(p)}
                  onChange={(e) =>
                    onChange({
                      subject,
                      grant: {
                        kind: "custom",
                        permissions: e.target.checked
                          ? [...new Set([...held, p])].sort()
                          : held.filter((x) => x !== p),
                      },
                    })
                  }
                />
              ))}
            </span>
          );
        }
        return held.length > 0 ? (
          <span className="fc-badges">
            {held.map((p) => (
              <Badge key={p} mono>
                {p}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="fc-muted">None</span>
        );
      },
    },
  ];
  return (
    <Table
      columns={columns}
      rows={matrix.subjects.map((subject) => ({ subject }))}
      rowKey={(row) => row.subject}
      empty="Nobody to give access to yet."
    />
  );
}

/** The profiles the tool suggests: its author's names for sets of permissions. */
function Profiles({ matrix }: { matrix: AccessMatrixData }) {
  const names = Object.keys(matrix.profiles);
  if (names.length === 0) {
    return (
      <p className="fc-muted">
        This tool suggests no profile: give permissions to Everyone and to teams.
      </p>
    );
  }
  return (
    <Table
      columns={[
        {
          key: "name",
          header: "Profile",
          render: ({ name }: { name: string }) => (
            <>
              {profileName(matrix, name)} <code>{name}</code>
              {matrix.profiles[name]!.default ? <Badge>default</Badge> : null}
            </>
          ),
        },
        {
          key: "grants",
          header: "Permissions",
          render: ({ name }: { name: string }) => (
            <span className="fc-badges">
              {matrix.profiles[name]!.grants.map((p) => (
                <Badge key={p} mono>
                  {p}
                </Badge>
              ))}
            </span>
          ),
        },
      ]}
      rows={names.map((name) => ({ name }))}
      rowKey={(row) => row.name}
    />
  );
}

export interface CellChange {
  subject: string;
  action: string;
  allowed: boolean;
}

export interface ProfileChange {
  subject: string;
  grant: ProfileGrant;
}

/**
 * Sends the drafted mapping and cells in one request: the platform applies them all or none. A
 * cell back at its default is sent as `null` so that the exception is dropped instead of stored
 * equal to it. `shown` is the matrix with the drafts applied (`withDraft`).
 */
export async function saveAccessMatrix(
  sendJson: SendJson,
  tool: string,
  shown: AccessMatrixData,
  changes: CellChange[],
  profiles: ProfileChange[] = [],
): Promise<void> {
  ok(
    await typedSender(sendJson)(addresses.putAccessMatrix, {
      params: { tool },
      json: {
        ...(profiles.length > 0
          ? { grants: profiles.map(({ subject, grant }) => ({ subject, grant })) }
          : {}),
        ...(changes.length > 0
          ? {
              changes: changes.map(({ subject, action, allowed }) => ({
                subject,
                action,
                allowed: allowed === shown.cells[subject]?.[action]?.default ? null : allowed,
              })),
            }
          : {}),
      },
    }),
  );
}

/**
 * Applies the drafts on top of a loaded matrix: the subjects' new grants (and the defaults of their
 * cells), then the flipped cells.
 */
export function withDraft(
  matrix: AccessMatrixData,
  draft: Map<string, CellChange>,
  profiles: Map<string, ProfileChange> = new Map(),
): AccessMatrixData {
  const grants: AccessMatrixData["grants"] = {};
  const cells: AccessMatrixData["cells"] = {};
  for (const subject of matrix.subjects) {
    const grant = profiles.get(subject)?.grant ?? matrix.grants[subject] ?? NONE;
    grants[subject] = grant;
    const held = permissionsFor(matrix, grant);
    cells[subject] = Object.fromEntries(
      matrix.columns.map((action) => {
        const loaded = matrix.cells[subject]?.[action];
        const level = matrix.levels[action];
        const fallback = level === undefined ? (loaded?.default ?? false) : held.includes(level);
        const allowed =
          draft.get(`${subject}\u0000${action}`)?.allowed ?? loaded?.override ?? fallback;
        return [
          action,
          {
            allowed,
            default: fallback,
            changed: allowed !== fallback,
            ...(loaded?.override === undefined ? {} : { override: loaded.override }),
          },
        ];
      }),
    );
  }
  return { ...matrix, grants, cells };
}

const sameGrant = (a: ProfileGrant, b: ProfileGrant) =>
  JSON.stringify(a.kind === "custom" ? { ...a, permissions: [...a.permissions].sort() } : a) ===
  JSON.stringify(b.kind === "custom" ? { ...b, permissions: [...b.permissions].sort() } : b);

export interface AccessMatrixEditorProps {
  tool: string;
  fetchJson: (path: string) => Promise<unknown>;
  sendJson: SendJson;
  /** Whether the person may change it (`access:write`); otherwise the tab only shows. */
  readOnly?: boolean;
}

/** The Access tab of a tool: read by `access:read`, changed with Save by `access:write`. */
export function AccessMatrixEditor({
  tool,
  fetchJson,
  sendJson,
  readOnly = false,
}: AccessMatrixEditorProps) {
  const [loaded, setLoaded] = useState<AccessMatrixData>();
  const [draft, setDraft] = useState(new Map<string, CellChange>());
  const [profiles, setProfiles] = useState(new Map<string, ProfileChange>());
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
        setProfiles(new Map());
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

  if (!loaded) {
    return status === "error" ? (
      <Notice tone="danger" title="The access of this tool could not be loaded.">
        {error ?? "Check your connection, then reload the page."}
      </Notice>
    ) : (
      <Loading shape="table" label="Loading the access of this tool" />
    );
  }
  const shown = withDraft(loaded, draft, profiles);
  const pending = draft.size + profiles.size;
  return (
    <div className="fc-stack">
      <h3>Profiles this tool suggests</h3>
      <Profiles matrix={loaded} />
      <h3>Who may use this tool</h3>
      <p className="fc-muted">
        A new tool gives Admins every permission and Everyone its default profile. Change it here:
        it applies to the next call, on every interface.
      </p>
      <ProfileMapping
        matrix={shown}
        {...(readOnly
          ? {}
          : {
              onChange: (change: ProfileChange) => {
                const next = new Map(profiles);
                // Choosing back what is saved is no change at all.
                if (sameGrant(loaded.grants[change.subject] ?? NONE, change.grant)) {
                  next.delete(change.subject);
                } else next.set(change.subject, change);
                setProfiles(next);
                setStatus("idle");
              },
            })}
      />
      <h3>Exceptions by action</h3>
      <AccessMatrix
        matrix={shown}
        {...(readOnly
          ? {}
          : {
              onToggle: (change: CellChange) => {
                const key = `${change.subject}\u0000${change.action}`;
                const next = new Map(draft);
                // Flipping back to what is saved is no change at all.
                if (loaded.cells[change.subject]?.[change.action]?.allowed === change.allowed)
                  next.delete(key);
                else next.set(key, change);
                setDraft(next);
                setStatus("idle");
              },
            })}
      />
      {readOnly ? (
        <Notice tone="info">
          You can see who may use this tool. Changing it needs the permission &quot;Give
          access&quot;.
        </Notice>
      ) : (
        <div>
          <Button
            disabled={pending === 0 || status === "saving"}
            onClick={async () => {
              setStatus("saving");
              try {
                await saveAccessMatrix(
                  sendJson,
                  tool,
                  shown,
                  [...draft.values()],
                  [...profiles.values()],
                );
                setReload((n) => n + 1);
                setStatus("saved");
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
                setStatus("error");
              }
            }}
          >
            Save changes
          </Button>
        </div>
      )}
      {status === "saved" ? (
        <Notice tone="success">Saved. It applies to the next call, on every interface.</Notice>
      ) : null}
      {status === "error" ? (
        <Notice tone="danger" title="The access was not saved.">
          {error} Try again.
        </Notice>
      ) : null}
    </div>
  );
}
