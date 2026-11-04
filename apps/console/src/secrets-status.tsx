import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient } from "./api";
import { Badge, Table, type TableColumn } from "@forgeron/ui";

// The secrets of a tool, per environment: "set" or "missing", never a value (docs/sdk.md section 10).
// Entering or editing values is not here: the CLI does it (`forgeron secrets set`).

const ENVIRONMENTS = ["preview", "production"] as const;
type Environment = (typeof ENVIRONMENTS)[number];

export interface SecretStatusRow {
  name: string;
  environments: Record<Environment, "set" | "missing">;
}

/**
 * Asks the platform for a tool's secrets status, the same answer as the admin MCP's
 * `secrets_status`. Only names and states are kept, whatever else the answer holds.
 */
export async function loadSecretsStatus(
  fetchJson: (path: string) => Promise<unknown>,
  tool: string,
): Promise<SecretStatusRow[]> {
  const body = ok(await typedClient(fetchJson)(addresses.secretsStatus, { params: { tool } }));
  return (body.secrets ?? []).map((secret) => ({
    name: String(secret.name),
    environments: Object.fromEntries(
      ENVIRONMENTS.map((env) => [env, secret.environments?.[env] === "set" ? "set" : "missing"]),
    ) as SecretStatusRow["environments"],
  }));
}

const columns: Array<TableColumn<SecretStatusRow>> = [
  { key: "name", header: "Secret", mono: true },
  ...ENVIRONMENTS.map((env) => ({
    key: env,
    header: env[0]!.toUpperCase() + env.slice(1),
    render: (row: SecretStatusRow) => (
      <Badge tone={row.environments[env] === "set" ? "success" : "warning"} dot>
        {row.environments[env]}
      </Badge>
    ),
  })),
];

export function SecretsStatus({ rows }: { rows: ReadonlyArray<SecretStatusRow> }) {
  return (
    <Table
      columns={columns}
      rows={rows}
      rowKey={(row) => row.name}
      empty="This tool declares no secret."
    />
  );
}
