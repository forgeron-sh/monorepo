import { ConstraintChip } from "@forgeron/ui";
import type { DbTable } from "./api";

/**
 * The tables and how they point at each other: one card per table, then the list of relations. A drawn
 * diagram (FOR-135) can replace it; the list stays as its text alternative.
 */
export function SchemaView({
  tables,
  onOpen,
}: {
  tables: DbTable[];
  onOpen: (table: string) => void;
}) {
  const relations = tables.flatMap((t) =>
    t.foreignKeys.map((f) => ({
      from: `${t.name}.${f.columns.join(", ")}`,
      to: `${f.references.table}.${f.references.columns.join(", ")}`,
      onDelete: f.onDelete.toLowerCase(),
    })),
  );
  return (
    <div className="fc-stack">
      <section aria-labelledby="schema-relations">
        <h3 id="schema-relations" className="fc-db-h">
          Relations
        </h3>
        {relations.length === 0 ? (
          <p className="fc-section-hint">No table points at another.</p>
        ) : (
          <ul className="fc-db-relations">
            {relations.map((r) => (
              <li key={`${r.from}>${r.to}`}>
                <code>{r.from}</code> <span aria-label="references">→</span> <code>{r.to}</code>
                <span className="fc-db-relation-note"> on delete {r.onDelete}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="schema-tables">
        <h3 id="schema-tables" className="fc-db-h">
          Tables
        </h3>
        <div className="fc-db-cards">
          {tables.map((table) => (
            <article key={table.name} className="fc-db-card">
              <h4 className="fc-db-card-title">
                <button type="button" className="fc-db-link" onClick={() => onOpen(table.name)}>
                  {table.name}
                </button>
                <span className="fc-db-count">{table.rows} rows</span>
              </h4>
              <ul className="fc-db-card-cols">
                {table.columns.map((c) => (
                  <li key={c.name}>
                    <code>{c.name}</code>
                    <span className="fc-db-field-type">{c.type || "any"}</span>
                    {c.primaryKey ? <ConstraintChip kind="primary" /> : null}
                    {c.foreignKey ? (
                      <ConstraintChip
                        kind="foreignKey"
                        title={`${c.foreignKey.table}.${c.foreignKey.columns.join(", ")}`}
                      />
                    ) : null}
                    {c.masked ? <ConstraintChip kind="masked" /> : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
