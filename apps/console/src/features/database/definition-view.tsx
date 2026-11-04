import { ConstraintChip, Table } from "@forgeron/ui";
import type { DbColumn, DbTable } from "./api";

const chips = (column: DbColumn) => (
  <span className="fc-db-chips">
    {column.primaryKey ? <ConstraintChip kind="primary" /> : null}
    {column.notNull && !column.primaryKey ? <ConstraintChip kind="notNull" /> : null}
    {column.unique ? <ConstraintChip kind="unique" /> : null}
    {column.foreignKey ? (
      <ConstraintChip
        kind="foreignKey"
        title={`${column.foreignKey.table}.${column.foreignKey.columns.join(", ")}`}
      />
    ) : null}
    {column.masked ? <ConstraintChip kind="masked" /> : null}
  </span>
);

/** Columns, indexes and foreign keys of one table, as SQLite reports them. */
export function DefinitionView({ table }: { table: DbTable }) {
  return (
    <div className="fc-stack">
      <section aria-labelledby="def-columns">
        <h3 id="def-columns" className="fc-db-h">
          Columns
        </h3>
        <Table<DbColumn>
          columns={[
            { key: "name", header: "Name", mono: true },
            { key: "type", header: "Type", mono: true, render: (c) => c.type || "any" },
            { key: "constraints", header: "Constraints", render: chips },
            { key: "default", header: "Default", mono: true, render: (c) => c.default ?? "" },
          ]}
          rows={table.columns}
          rowKey={(c) => c.name}
        />
      </section>
      <section aria-labelledby="def-indexes">
        <h3 id="def-indexes" className="fc-db-h">
          Indexes
        </h3>
        <Table
          columns={[
            { key: "name", header: "Name", mono: true },
            {
              key: "columns",
              header: "Columns",
              mono: true,
              render: (i: DbTable["indexes"][number]) => i.columns.join(", "),
            },
            { key: "unique", header: "Unique", render: (i) => (i.unique ? "Yes" : "No") },
            {
              key: "origin",
              header: "Created by",
              render: (i) =>
                i.origin === "pk"
                  ? "Primary key"
                  : i.origin === "u"
                    ? "Unique constraint"
                    : "Index",
            },
          ]}
          rows={table.indexes}
          rowKey={(i) => i.name}
          empty="No index"
        />
      </section>
      <section aria-labelledby="def-fks">
        <h3 id="def-fks" className="fc-db-h">
          Foreign keys
        </h3>
        <Table
          columns={[
            {
              key: "from",
              header: "Columns",
              mono: true,
              render: (f: DbTable["foreignKeys"][number]) => f.columns.join(", "),
            },
            {
              key: "to",
              header: "References",
              mono: true,
              render: (f) => `${f.references.table}(${f.references.columns.join(", ")})`,
            },
            { key: "onDelete", header: "On delete", render: (f) => f.onDelete.toLowerCase() },
          ]}
          rows={table.foreignKeys}
          rowKey={(f) => f.columns.join(",")}
          empty="No foreign key"
        />
      </section>
    </div>
  );
}
