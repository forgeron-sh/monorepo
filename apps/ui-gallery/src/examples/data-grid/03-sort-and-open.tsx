import { DataGrid, type GridCell, type GridSort } from "@forgeron/ui";
import { useState } from "react";

const columns = [
  { name: "id", type: "integer", chips: [{ kind: "primary" as const }], numeric: true },
  {
    name: "customer_id",
    type: "integer",
    chips: [{ kind: "foreignKey" as const, title: "→ customers.id" }],
    numeric: true,
  },
  { name: "status", type: "text", chips: [{ kind: "notNull" as const }] },
  { name: "total", type: "numeric(10,2)", numeric: true },
  { name: "card", type: "text", masked: "Payment data: masked for your role" },
];

const data: GridCell[][] = [
  [1041, 12, "paid", 1240, { masked: "Payment data" }],
  [1042, 7, "draft", 86.5, { masked: "Payment data" }],
  [1043, 12, "sent", 3912, { masked: "Payment data" }],
  [1044, 31, "paid", 455.2, { masked: "Payment data" }],
  [1045, 7, "overdue", 129, { masked: "Payment data" }],
];

// The sort and the open row belong to the page: the grid shows them and asks for changes. The
// open row is kept by its id, so it stays open when the sort moves it.
export default function SortAndOpen() {
  const [sort, setSort] = useState<GridSort>({ column: "id", descending: true });
  const [open, setOpen] = useState<GridCell>(null);
  const at = columns.findIndex((c) => c.name === sort.column);
  const rows = [...data].sort((a, b) => {
    const x = a[at] as string | number;
    const y = b[at] as string | number;
    return (x < y ? -1 : x > y ? 1 : 0) * (sort.descending ? -1 : 1);
  });
  return (
    <div style={{ width: "100%" }}>
      <DataGrid
        label="invoices"
        columns={columns}
        rows={rows}
        sort={sort}
        onSort={(column) =>
          setSort((s) => ({ column, descending: s.column === column ? !s.descending : false }))
        }
        selectedRow={open === null ? undefined : rows.findIndex((row) => row[0] === open)}
        onOpenRow={(index) => setOpen(rows[index]![0]!)}
      />
    </div>
  );
}
