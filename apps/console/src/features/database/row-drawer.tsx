import { Button, ConstraintChip, Drawer } from "@forgeron/ui";
import type { DbColumn, RowCell } from "./api";

const show = (cell: RowCell) =>
  cell === null ? "NULL" : typeof cell === "object" ? "masked" : String(cell);

/** One row in full: each column, its type and chips, its value, and a way to copy it or the row. */
export function RowDrawer({
  table,
  columns,
  row,
  onCopy,
  onClose,
}: {
  table: string;
  columns: DbColumn[];
  row: RowCell[];
  onCopy: (text: string, what: string) => void;
  onClose: () => void;
}) {
  const asObject = Object.fromEntries(
    columns.map((c, i) => [
      c.name,
      typeof row[i] === "object" && row[i] !== null ? "masked" : row[i],
    ]),
  );
  return (
    <Drawer
      title={`Row of ${table}`}
      description="Read only."
      onClose={onClose}
      footer={
        <Button size="sm" onClick={() => onCopy(JSON.stringify(asObject, null, 2), "Row")}>
          Copy row as JSON
        </Button>
      }
    >
      <dl className="fc-db-fields">
        {columns.map((column, i) => {
          const cell = row[i] ?? null;
          const masked = cell !== null && typeof cell === "object";
          return (
            <div key={column.name} className="fc-db-field">
              <dt>
                <span className="fc-db-field-name">{column.name}</span>
                <span className="fc-db-field-type">{column.type || "any"}</span>
                {column.primaryKey ? <ConstraintChip kind="primary" /> : null}
                {column.foreignKey ? (
                  <ConstraintChip
                    kind="foreignKey"
                    title={`${column.foreignKey.table}.${column.foreignKey.columns.join(", ")}`}
                  />
                ) : null}
              </dt>
              <dd>
                {masked ? (
                  <span className="fc-db-masked">
                    masked:{" "}
                    {cell.masked === "tagged"
                      ? "tagged as personal data in the schema"
                      : "the name suggests personal data"}
                  </span>
                ) : (
                  <code className={cell === null ? "fc-db-null" : undefined}>{show(cell)}</code>
                )}
                {masked || cell === null ? null : (
                  <Button size="sm" variant="ghost" onClick={() => onCopy(show(cell), column.name)}>
                    Copy<span className="fc-sr"> {column.name}</span>
                  </Button>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </Drawer>
  );
}
