import {
  Button,
  Checkbox,
  DataGrid,
  EmptyState,
  Input,
  Notice,
  Pager,
  Select,
  Tabs,
  type GridColumn,
} from "@forgeron/ui";
import { useState } from "react";
import type { Api } from "../../api";
import { Loading, LoadError } from "../../states";
import { useLoad } from "../../use-load";
import {
  exportPath,
  loadEnvironments,
  loadRows,
  loadSchema,
  loadTable,
  loadTables,
  targetId,
  targetLabel,
  type DbColumn,
  type Filter,
  type Target,
} from "./api";
import { DefinitionView } from "./definition-view";
import { FilterBar } from "./filter-bar";
import { RowDrawer } from "./row-drawer";
import { SchemaView } from "./schema-view";

// The Database tab of a tool page: the tables of one environment or branch on the left, one table on the
// right as data, definition, or the schema of all of them. Read only; the gateway enforces who may look
// and what is masked (D-059). A screen of its own: nothing here writes.

const MASK_TEXT = {
  tagged: "Tagged as personal data in the schema",
  name: "The name suggests personal data",
} as const;

const gridColumn = (c: DbColumn): GridColumn => ({
  name: c.name,
  type: c.type,
  numeric: c.kind === "integer" || c.kind === "real",
  masked: c.masked ? MASK_TEXT[c.masked] : null,
  chips: [
    ...(c.primaryKey ? [{ kind: "primary" as const }] : []),
    ...(c.notNull && !c.primaryKey ? [{ kind: "notNull" as const }] : []),
    ...(c.unique ? [{ kind: "unique" as const }] : []),
    ...(c.foreignKey
      ? [
          {
            kind: "foreignKey" as const,
            title: `${c.foreignKey.table}.${c.foreignKey.columns.join(", ")}`,
          },
        ]
      : []),
  ],
});

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function DatabaseTab({ tool, api }: { tool: string; api: Api }) {
  const envs = useLoad(() => loadEnvironments(api.fetchJson, tool), [api, tool]);
  const [chosen, setChosen] = useState<string>();
  if (envs.loading) return <Loading shape="block" label="Loading environments" />;
  if (envs.error && !envs.data)
    return <LoadError what="The environments" error={envs.error} onRetry={envs.reload} />;
  const targets = envs.data ?? [];
  if (targets.length === 0) {
    return (
      <EmptyState
        title="Nothing deployed yet"
        description="A database exists once a version is deployed. Deploy from the terminal, then come back."
      />
    );
  }
  const target =
    targets.find((t) => targetId(t) === chosen) ??
    targets.find((t) => t.env === "production") ??
    targets[0]!;
  return (
    <Explorer
      key={targetId(target)}
      tool={tool}
      api={api}
      targets={targets}
      target={target}
      onTarget={(t) => setChosen(targetId(t))}
    />
  );
}

function Explorer({
  tool,
  api,
  targets,
  target,
  onTarget,
}: {
  tool: string;
  api: Api;
  targets: Target[];
  target: Target;
  onTarget: (target: Target) => void;
}) {
  const [platform, setPlatform] = useState(false);
  const [search, setSearch] = useState("");
  const [table, setTable] = useState<string>();
  const [view, setView] = useState("data");
  const tables = useLoad(
    () => loadTables(api.fetchJson, tool, target, platform),
    [api, tool, targetId(target), platform],
  );

  const all = tables.data ?? [];
  const shown = all.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()));
  const current = all.find((t) => t.name === table)?.name ?? all[0]?.name;

  return (
    <div className="fc-db">
      <aside className="fc-db-side" aria-label="Tables">
        <Select
          aria-label="Environment"
          value={targetId(target)}
          options={targets.map((t) => ({ value: targetId(t), label: targetLabel(t) }))}
          onChange={(e) => onTarget(targets.find((t) => targetId(t) === e.target.value)!)}
        />
        <Input
          type="search"
          aria-label="Search tables"
          placeholder="Search tables"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {tables.loading ? (
          <Loading shape="list" label="Loading tables" />
        ) : tables.error && !tables.data ? (
          <LoadError what="The tables" error={tables.error} onRetry={tables.reload} />
        ) : shown.length === 0 ? (
          <p className="fc-section-hint">
            {all.length === 0 ? "This database has no table." : "No table matches."}
          </p>
        ) : (
          <ul className="fc-db-tables">
            {shown.map((t) => (
              <li key={t.name}>
                <button
                  type="button"
                  className="fc-db-table"
                  aria-current={t.name === current ? "true" : undefined}
                  onClick={() => {
                    setTable(t.name);
                    if (view === "schema") setView("data");
                  }}
                >
                  <span className="fc-db-table-name">{t.name}</span>
                  <span className="fc-db-count">{t.rows}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Checkbox
          label="Show platform tables"
          checked={platform}
          onChange={(e) => setPlatform(e.target.checked)}
        />
      </aside>
      <div className="fc-db-main">
        <Tabs
          label="Database views"
          tabs={[
            { id: "data", label: "Data" },
            { id: "definition", label: "Definition" },
            { id: "schema", label: "Schema" },
          ]}
          value={view}
          onChange={setView}
        >
          {view === "schema" ? (
            <SchemaPanel
              tool={tool}
              api={api}
              target={target}
              platform={platform}
              onOpen={(name) => {
                setTable(name);
                setView("data");
              }}
            />
          ) : !current ? (
            <EmptyState title="No table to show" description="Pick a table on the left." />
          ) : view === "definition" ? (
            <DefinitionPanel key={current} tool={tool} api={api} target={target} table={current} />
          ) : (
            <DataPanel
              key={`${targetId(target)}/${current}`}
              tool={tool}
              api={api}
              target={target}
              table={current}
            />
          )}
        </Tabs>
      </div>
    </div>
  );
}

function SchemaPanel({
  tool,
  api,
  target,
  platform,
  onOpen,
}: {
  tool: string;
  api: Api;
  target: Target;
  platform: boolean;
  onOpen: (t: string) => void;
}) {
  const schema = useLoad(
    () => loadSchema(api.fetchJson, tool, target, platform),
    [api, tool, targetId(target), platform],
  );
  if (schema.loading) return <Loading shape="table" label="Loading the schema" />;
  if (schema.error && !schema.data)
    return <LoadError what="The schema" error={schema.error} onRetry={schema.reload} />;
  return <SchemaView tables={schema.data ?? []} onOpen={onOpen} />;
}

function DefinitionPanel({
  tool,
  api,
  target,
  table,
}: {
  tool: string;
  api: Api;
  target: Target;
  table: string;
}) {
  const definition = useLoad(
    () => loadTable(api.fetchJson, tool, target, table),
    [api, tool, targetId(target), table],
  );
  if (definition.loading) return <Loading shape="block" label="Loading the definition" />;
  if (definition.error && !definition.data)
    return <LoadError what="The definition" error={definition.error} onRetry={definition.reload} />;
  return <DefinitionView table={definition.data!} />;
}

function DataPanel({
  tool,
  api,
  target,
  table,
}: {
  tool: string;
  api: Api;
  target: Target;
  table: string;
}) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: string; descending: boolean }>();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [open, setOpen] = useState<number>();
  const [notice, setNotice] = useState("");
  const query = {
    page,
    filters,
    ...(sort ? { sort: sort.column, descending: sort.descending } : {}),
  };
  const rows = useLoad(
    () => loadRows(api.fetchJson, tool, target, table, query),
    [
      api,
      tool,
      targetId(target),
      table,
      page,
      sort?.column,
      sort?.descending,
      JSON.stringify(filters),
    ],
  );
  const data = rows.data;
  const toggleSort = (column: string) => {
    setPage(1);
    setSort(
      !sort || sort.column !== column
        ? { column, descending: false }
        : sort.descending
          ? undefined
          : { column, descending: true },
    );
  };
  const copied = async (text: string, what: string) =>
    setNotice(
      (await copy(text))
        ? `${what} copied.`
        : "Copying is not allowed here. Select the text instead.",
    );

  if (rows.loading && !data) return <Loading shape="table" label="Loading rows" />;
  if (rows.error && !data)
    return <LoadError what="The rows" error={rows.error} onRetry={rows.reload} />;
  if (!data) return null;
  const nextAllowed = data.hasMore && page * data.pageSize <= data.offsetCap;

  return (
    <div className="fc-stack">
      <FilterBar
        columns={data.columns}
        applied={filters}
        onApply={(next) => {
          setPage(1);
          setFilters(next);
        }}
      />
      {rows.error ? <LoadError what="The rows" error={rows.error} onRetry={rows.reload} /> : null}
      <DataGrid
        label={`Rows of ${table}`}
        columns={data.columns.map(gridColumn)}
        rows={data.rows}
        sort={sort}
        onSort={toggleSort}
        onOpenRow={setOpen}
        onCopyCell={(text, column) => void copied(text, column)}
        selectedRow={open}
        empty={filters.length ? "No row matches these filters." : "This table is empty."}
      />
      <Pager
        page={page}
        pageSize={data.pageSize}
        count={data.rows.length}
        total={data.total}
        hasMore={nextAllowed}
        onPage={setPage}
        limitNote={
          data.hasMore && !nextAllowed
            ? `Rows past ${data.offsetCap} are not paged. Narrow the filter.`
            : undefined
        }
      />
      <div className="fc-db-actions">
        <Button size="sm" href={exportPath(tool, target, table, query)} download>
          Export CSV
        </Button>
        <span className="fc-section-hint">At most 10 000 rows, masked columns left out.</span>
      </div>
      <p role="status" className="fc-db-status">
        {notice}
      </p>
      {open !== undefined && data.rows[open] ? (
        <div className="fc-db-drawer">
          <RowDrawer
            table={table}
            columns={data.columns}
            row={data.rows[open]!}
            onCopy={(text, what) => void copied(text, what)}
            onClose={() => setOpen(undefined)}
          />
        </div>
      ) : null}
      {data.columns.some((c) => c.masked) ? (
        <Notice tone="info" title="Some columns are masked.">
          Personal data is hidden by the server, never sent to this page. Tag a column with{" "}
          <code>.personal()</code> in the schema.
        </Notice>
      ) : null}
    </div>
  );
}
