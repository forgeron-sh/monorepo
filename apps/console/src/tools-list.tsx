import { Badge, Table, type TableColumn } from "@forgeron/ui";

// The workspace's tools and the version each environment serves: the answer of `GET /api/tools`,
// the same listing as the admin MCP's `tools_list` (docs/sdk.md sections 15 and 17).

export interface ToolRow {
  name: string;
  production: string | null;
  pilot: string | null;
  previews: Array<{ branch: string; version: string }>;
}

const text = (value: unknown) => (typeof value === "string" ? value : null);

/** Asks the platform for the tools. Only the fields shown are kept, whatever else the answer holds. */
export async function loadTools(fetchJson: (path: string) => Promise<unknown>): Promise<ToolRow[]> {
  const body = (await fetchJson("/api/tools")) as { tools?: Array<Record<string, unknown>> };
  return (body.tools ?? []).map((tool) => ({
    name: String(tool.name),
    production: text(tool.production),
    pilot: text(tool.pilot),
    previews: Array.isArray(tool.previews)
      ? tool.previews.map((p: { branch?: unknown; version?: unknown }) => ({
          branch: String(p.branch),
          version: String(p.version),
        }))
      : [],
  }));
}

const version = (value: string | null) =>
  value ? <Badge tone="success">{value}</Badge> : <Badge tone="neutral">not deployed</Badge>;

const columns: Array<TableColumn<ToolRow>> = [
  { key: "name", header: "Tool", mono: true },
  {
    key: "preview",
    header: "Preview",
    render: (row) =>
      row.previews.length === 0
        ? version(null)
        : row.previews.map((p) => (
            <Badge key={p.branch} tone="strong">{`${p.branch} ${p.version}`}</Badge>
          )),
  },
  { key: "pilot", header: "Pilot", render: (row) => version(row.pilot) },
  { key: "production", header: "Production", render: (row) => version(row.production) },
];

export function ToolsList({
  rows,
  onOpen,
}: {
  rows: ReadonlyArray<ToolRow>;
  /** Makes a row a button that opens the tool. */
  onOpen?: (row: ToolRow) => void;
}) {
  return (
    <Table
      columns={columns}
      rows={rows}
      rowKey={(row) => row.name}
      {...(onOpen ? { onRowClick: onOpen } : {})}
      empty="No tool installed yet."
    />
  );
}
